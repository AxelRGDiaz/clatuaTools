// Maintenance actions operate on well-known, fixed filesystem locations
// only (the user's %TEMP%, C:\Windows\Temp, the Explorer thumbnail cache).
// Deletion always uses Node's fs APIs directly (never `rm`/`del` through a
// shell), is best-effort per-file (locked files are skipped, not fatal),
// and never touches anything outside those specific folders.

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import type { MaintenanceAction, MaintenanceActionResult } from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured, openTool } from './commandRunner.service'
import { logger } from './logger.service'

async function purgeDirectoryContents(
  dirPath: string
): Promise<{ freedBytes: number; skipped: number }> {
  let freedBytes = 0
  let skipped = 0

  let entries: string[] = []
  try {
    entries = await fs.readdir(dirPath)
  } catch {
    return { freedBytes: 0, skipped: 0 }
  }

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry)
    try {
      const stat = await fs.stat(entryPath)
      if (stat.isDirectory()) {
        const size = await dirSize(entryPath)
        await fs.rm(entryPath, { recursive: true, force: true })
        freedBytes += size
      } else {
        await fs.rm(entryPath, { force: true })
        freedBytes += stat.size
      }
    } catch {
      skipped += 1
    }
  }

  return { freedBytes, skipped }
}

async function dirSize(dirPath: string): Promise<number> {
  let total = 0
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += await dirSize(entryPath)
      } else {
        const stat = await fs.stat(entryPath).catch(() => null)
        if (stat) total += stat.size
      }
    }
  } catch {
    // best-effort
  }
  return total
}

async function cleanTempUser(): Promise<MaintenanceActionResult> {
  const dir = os.tmpdir()
  logger.info(`Limpiando temporales de usuario en ${dir}…`)
  const { freedBytes, skipped } = await purgeDirectoryContents(dir)
  const message = `Liberados ${(freedBytes / 1024 / 1024).toFixed(1)} MB.${skipped ? ` ${skipped} elementos en uso se omitieron.` : ''}`
  logger.success(message)
  return { action: 'clean-temp-user', success: true, freedBytes, message }
}

async function cleanTempWindows(): Promise<MaintenanceActionResult> {
  const dir = 'C:\\Windows\\Temp'
  logger.info(`Limpiando temporales de Windows en ${dir}…`)
  const { freedBytes, skipped } = await purgeDirectoryContents(dir)
  const message = `Liberados ${(freedBytes / 1024 / 1024).toFixed(1)} MB.${skipped ? ` ${skipped} elementos en uso se omitieron.` : ''}`
  logger.success(message)
  return { action: 'clean-temp-windows', success: true, freedBytes, message }
}

async function cleanExplorerCache(): Promise<MaintenanceActionResult> {
  const dir = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer')
  logger.info('Limpiando caché de iconos y miniaturas del Explorador…')
  let freedBytes = 0
  let skipped = 0
  try {
    const entries = await fs.readdir(dir)
    for (const entry of entries) {
      if (!/^(iconcache|thumbcache_).*\.db$/i.test(entry)) continue
      const entryPath = path.join(dir, entry)
      try {
        const stat = await fs.stat(entryPath)
        await fs.rm(entryPath, { force: true })
        freedBytes += stat.size
      } catch {
        skipped += 1
      }
    }
  } catch {
    // directory may not exist; nothing to clean
  }
  const message = `Caché de Explorador limpiada. Liberados ${(freedBytes / 1024).toFixed(0)} KB.${skipped ? ` ${skipped} archivos en uso se omitieron.` : ''}`
  logger.success(message)
  return { action: 'clean-explorer-cache', success: true, freedBytes, message }
}

async function restartExplorer(): Promise<MaintenanceActionResult> {
  logger.info('Reiniciando Windows Explorer…')
  await runCaptured('taskkill.exe', ['/F', '/IM', 'explorer.exe'])
  await openTool('explorer.exe', [])
  logger.success('Windows Explorer reiniciado.')
  return {
    action: 'restart-explorer',
    success: true,
    message: 'Explorer reiniciado correctamente.'
  }
}

async function openStartupApps(): Promise<MaintenanceActionResult> {
  await openTool('taskmgr.exe', [])
  return {
    action: 'open-startup-apps',
    success: true,
    message: 'Abre la pestaña "Inicio" en el Administrador de tareas.'
  }
}

export async function runMaintenanceAction(
  action: MaintenanceAction
): Promise<MaintenanceActionResult> {
  if (!isWindows) {
    return { action, success: false, message: 'Esta acción solo está disponible en Windows.' }
  }

  switch (action) {
    case 'clean-temp-user':
      return cleanTempUser()
    case 'clean-temp-windows':
      return cleanTempWindows()
    case 'clean-explorer-cache':
      return cleanExplorerCache()
    case 'restart-explorer':
      return restartExplorer()
    case 'open-startup-apps':
      return openStartupApps()
    default:
      return { action, success: false, message: 'Acción de mantenimiento desconocida.' }
  }
}
