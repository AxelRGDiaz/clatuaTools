// Wraps Windows Package Manager (winget). Every winget invocation uses
// execFile with a fixed argv array; the only "variable" input is a winget
// package id, which is always validated against the static apps.json
// catalog (isValidWingetId + exact catalog match) before being used —
// never a free-form string typed by the user.

import type { AppEntry, InstallResult, WingetStatus } from '../../shared/types'
import { isValidWingetId } from '../security/commandWhitelist'
import { isWindows } from '../security/platform'
import { runCaptured } from './commandRunner.service'
import { logger } from './logger.service'
import appsCatalog from '../config/apps.json'

const APPS: AppEntry[] = appsCatalog as AppEntry[]

export function listApps(): AppEntry[] {
  return APPS
}

function getAppOrThrow(appId: string): AppEntry {
  const app = APPS.find((a) => a.id === appId)
  if (!app) {
    throw new Error(`Programa desconocido: "${appId}" no existe en el catálogo.`)
  }
  if (!isValidWingetId(app.wingetId)) {
    throw new Error(`El identificador de winget para "${app.name}" no es válido.`)
  }
  return app
}

export async function checkWingetAvailable(): Promise<WingetStatus> {
  if (!isWindows) {
    return { available: false, version: null }
  }
  const result = await runCaptured('winget', ['--version'])
  if (!result.success) {
    return { available: false, version: null }
  }
  return { available: true, version: result.stdout.trim() }
}

export async function isAppInstalled(appId: string): Promise<boolean> {
  const app = getAppOrThrow(appId)
  if (!isWindows) return false

  const result = await runCaptured('winget', [
    'list',
    '--id',
    app.wingetId,
    '--exact',
    '--accept-source-agreements',
    '--disable-interactivity'
  ])
  if (!result.success) return false
  return result.stdout.toLowerCase().includes(app.wingetId.toLowerCase())
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

  logger.info(`Instalando ${app.name} (${app.wingetId})…`)
  const result = await runCaptured(
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
    { timeoutMs: 10 * 60 * 1000 }
  )

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
  appIds: string[],
  onProgress?: (result: InstallResult) => void
): Promise<InstallResult[]> {
  const results: InstallResult[] = []
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
