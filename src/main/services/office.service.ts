// Detects installed Microsoft Office products via the registry (read-only,
// official uninstall keys) and can launch a legitimate installer flow.
//
// IMPORTANT: this app never implements activation bypass, KMS emulation or
// license cracking. "Install" only ever shells out to Microsoft's official
// setup (winget's Office deployment id, which itself wraps the Office
// Deployment Tool) and activation is handled by the user signing in with a
// genuine Microsoft 365 / volume license account inside Office itself.

import type {
  OfficeInstallChoice,
  OfficeProductInfo,
  OfficeStatus,
  CommandExecutionResult
} from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured, openTool } from './commandRunner.service'
import { logger } from './logger.service'

// A single, fixed PowerShell script (no interpolated user input) that reads
// the uninstall registry keys and prints Office-related entries as JSON.
const DETECT_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$paths = @(
  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
)
$items = Get-ItemProperty -Path $paths | Where-Object { $_.DisplayName -like '*Microsoft 365*' -or $_.DisplayName -like '*Microsoft Office*' }
$results = foreach ($i in $items) {
  [PSCustomObject]@{
    Name = $i.DisplayName
    Version = $i.DisplayVersion
    Is64 = $i.PSPath -notlike '*WOW6432Node*'
  }
}
$results | ConvertTo-Json -Compress
`.trim()

export async function detectOffice(): Promise<OfficeStatus> {
  if (!isWindows) {
    return { installed: false, products: [], licenseStatus: null }
  }

  const result = await runCaptured('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    DETECT_SCRIPT
  ])
  if (!result.success || !result.stdout.trim()) {
    return { installed: false, products: [], licenseStatus: null }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(result.stdout.trim())
  } catch {
    return { installed: false, products: [], licenseStatus: null }
  }

  const rawList = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  const products: OfficeProductInfo[] = rawList
    .filter(
      (r): r is { Name: string; Version: string; Is64: boolean } =>
        !!r && typeof r.Name === 'string'
    )
    .map((r) => ({
      name: r.Name,
      version: r.Version ?? 'Desconocida',
      architecture: r.Is64 ? '64-bit' : '32-bit'
    }))

  const licenseStatus = await getOfficeLicenseStatus()

  return { installed: products.length > 0, products, licenseStatus }
}

async function getOfficeLicenseStatus(): Promise<string | null> {
  // Office ships ospp.vbs under its install path (Office16/Office15/...).
  // We search common install roots read-only; if not found we simply report
  // "unknown" rather than guessing.
  const searchScript = `
$ErrorActionPreference = 'SilentlyContinue'
$candidates = Get-ChildItem -Path 'C:\\Program Files\\Microsoft Office*','C:\\Program Files (x86)\\Microsoft Office*' -Recurse -Filter 'ospp.vbs' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($candidates) { $candidates.FullName } else { '' }
`.trim()

  const findResult = await runCaptured('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    searchScript
  ])
  const osppPath = findResult.stdout.trim()
  if (!osppPath) return null

  const statusResult = await runCaptured('cscript.exe', ['//Nologo', osppPath, '/dstatus'])
  if (!statusResult.success) return null
  return statusResult.stdout.trim() || null
}

export function openOfficeActivation(): Promise<void> {
  logger.info('Abriendo la página oficial de cuenta y activación de Microsoft 365…')
  return openTool('cmd.exe', ['/c', 'start', '', 'https://account.microsoft.com/services'])
}

/**
 * Launches a legitimate Office installer via winget's Office deployment
 * package id. This is a thin wrapper — no bypass of any kind.
 */
export function installOffice(choice: OfficeInstallChoice): Promise<CommandExecutionResult> {
  const wingetId = choice === 'microsoft365' ? 'Microsoft.Office' : 'Microsoft.Office.LTSC'
  logger.info(`Iniciando instalación de Office (${choice}) mediante winget: ${wingetId}`)
  return runCaptured(
    'winget',
    [
      'install',
      '--id',
      wingetId,
      '--exact',
      '--accept-package-agreements',
      '--accept-source-agreements'
    ],
    { timeoutMs: 20 * 60 * 1000 }
  )
}
