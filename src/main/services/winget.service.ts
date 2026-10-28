// Wraps Windows Package Manager (winget). Every winget invocation uses
// execFile with a fixed argv array; the only "variable" input is a winget
// package id, which is always validated against the static apps.json
// catalog (isValidWingetId + exact catalog match) before being used —
// never a free-form string typed by the user.

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import type { AppEntry, InstallResult, WingetStatus } from '../../shared/types'
import { isValidWingetId } from '../security/commandWhitelist'
import { isWindows } from '../security/platform'
import { runCaptured } from './commandRunner.service'
import { cachedQuery } from './cache'
import { logger } from './logger.service'
import appsCatalog from '../config/apps.json'

const APPS: AppEntry[] = appsCatalog as AppEntry[]

export function listApps(): AppEntry[] {
  return APPS
}

function getAppOrThrow(appId: string): AppEntry {
  const app = typeof appId === 'string' ? APPS.find((a) => a.id === appId) : undefined
  if (!app) {
    throw new Error(`Programa desconocido: "${appId}" no existe en el catálogo.`)
  }
  if (!isValidWingetId(app.wingetId)) {
    throw new Error(`El identificador de winget para "${app.name}" no es válido.`)
  }
  return app
}

const wingetStatus = cachedQuery<WingetStatus>(5 * 60 * 1000, async () => {
  if (!isWindows) {
    return { available: false, version: null }
  }
  const result = await runCaptured('winget', ['--version'], { quiet: true })
  if (!result.success) {
    return { available: false, version: null }
  }
  return { available: true, version: result.stdout.trim() }
})

export function checkWingetAvailable(): Promise<WingetStatus> {
  return wingetStatus.get()
}

/**
 * Lowercased winget ids of every installed package, read with a single
 * `winget export` (JSON) instead of one `winget list` process per catalog
 * entry. Returns null if the export could not be produced.
 */
async function exportInstalledIds(): Promise<Set<string> | null> {
  const file = path.join(os.tmpdir(), `clatua-winget-${randomUUID()}.json`)
  try {
    await runCaptured(
      'winget',
      [
        'export',
        '--output',
        file,
        '--source',
        'winget',
        '--accept-source-agreements',
        '--disable-interactivity'
      ],
      { timeoutMs: 2 * 60 * 1000, quiet: true }
    )
    // winget exits non-zero when some installed packages have no source
    // match, but still writes the file — so read it regardless.
    const parsed = JSON.parse(await fs.readFile(file, 'utf-8')) as {
      Sources?: { Packages?: { PackageIdentifier?: string }[] }[]
    }
    const ids = new Set<string>()
    for (const source of parsed.Sources ?? []) {
      for (const pkg of source.Packages ?? []) {
        if (pkg.PackageIdentifier) ids.add(pkg.PackageIdentifier.toLowerCase())
      }
    }
    return ids
  } catch {
    return null
  } finally {
    fs.rm(file, { force: true }).catch(() => {})
  }
}

const installedIds = cachedQuery(60 * 1000, async () => {
  if (!isWindows) return new Set<string>()
  logger.info('Comprobando programas instalados…')
  const ids = await exportInstalledIds()
  if (!ids) throw new Error('No se pudo obtener la lista de programas instalados.')
  return ids
})

async function isInstalledViaList(app: AppEntry): Promise<boolean> {
  const result = await runCaptured(
    'winget',
    [
      'list',
      '--id',
      app.wingetId,
      '--exact',
      '--accept-source-agreements',
      '--disable-interactivity'
    ],
    { quiet: true }
  )
  return result.success && result.stdout.toLowerCase().includes(app.wingetId.toLowerCase())
}

export async function isAppInstalled(appId: string): Promise<boolean> {
  const app = getAppOrThrow(appId)
  if (!isWindows) return false
  try {
    return (await installedIds.get()).has(app.wingetId.toLowerCase())
  } catch {
    return isInstalledViaList(app)
  }
}

/** Catalog ids (apps.json `id`, not winget ids) of the apps already installed. */
export async function listInstalledAppIds(): Promise<string[]> {
  if (!isWindows) return []
  try {
    const ids = await installedIds.get()
    return APPS.filter((a) => ids.has(a.wingetId.toLowerCase())).map((a) => a.id)
  } catch {
    const flags = await Promise.all(APPS.map((a) => isInstalledViaList(a)))
    return APPS.filter((_, i) => flags[i]).map((a) => a.id)
  }
}

// Windows Installer only allows one installation at a time (a second one
// fails with error 1618), but the UI can start installs from several places
// at once: Programas, Instalación rápida, recetas, Office. Every install is
// queued here and runs one after another.
let installQueue: Promise<unknown> = Promise.resolve()

export function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = installQueue.then(task, task)
  installQueue = next.catch(() => {})
  return next
}

export async function installApp(appId: string): Promise<InstallResult> {
  const app = getAppOrThrow(appId)

  if (!isWindows) {
    logger.warning(
      `winget no está disponible en esta plataforma; omitiendo instalación de ${app.name}.`
    )
    return {
      appId,
      appName: app.name,
      success: false,
      alreadyInstalled: false,
      message: 'winget solo está disponible en Windows.'
    }
  }

  logger.info(`Comprobando si ${app.name} ya está instalado…`)
  const alreadyInstalled = await isAppInstalled(appId)
  if (alreadyInstalled) {
    logger.success(`${app.name} ya está instalado. Se omite.`)
    return {
      appId,
      appName: app.name,
      success: true,
      alreadyInstalled: true,
      message: 'Ya estaba instalado.'
    }
  }

  const result = await runExclusive(() => {
    logger.info(`Instalando ${app.name} (${app.wingetId})…`)
    return runCaptured(
      'winget',
      [
        'install',
        '--id',
        app.wingetId,
        '--exact',
        '--silent',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity'
      ],
      { timeoutMs: 10 * 60 * 1000, stream: true }
    )
  })
  installedIds.invalidate()

  if (result.success) {
    logger.success(`${app.name} instalado correctamente.`)
    return {
      appId,
      appName: app.name,
      success: true,
      alreadyInstalled: false,
      message: 'Instalado correctamente.'
    }
  }

  logger.error(`Error al instalar ${app.name}: ${result.stderr || result.stdout}`)
  return {
    appId,
    appName: app.name,
    success: false,
    alreadyInstalled: false,
    message:
      result.stderr.trim() || result.stdout.trim() || 'Error desconocido durante la instalación.'
  }
}

export async function installBatch(
  appIds: unknown,
  onProgress?: (result: InstallResult) => void
): Promise<InstallResult[]> {
  const results: InstallResult[] = []
  if (!Array.isArray(appIds)) return results
  for (const appId of appIds) {
    try {
      const result = await installApp(appId)
      results.push(result)
      onProgress?.(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const failed: InstallResult = {
        appId,
        appName: appId,
        success: false,
        alreadyInstalled: false,
        message
      }
      results.push(failed)
      onProgress?.(failed)
    }
  }
  return results
}
