// Detects installed Microsoft Office products via the registry (read-only,
// official uninstall keys) and can launch a legitimate installer flow.
//
// IMPORTANT: this app never implements activation bypass, KMS emulation or
// license cracking. "Install" only ever shells out to Microsoft's official
// setup (winget's Office deployment id, which itself wraps the Office
// Deployment Tool) and activation is handled by the user signing in with a
// genuine Microsoft 365 / volume license account inside Office itself.

import fs from 'fs/promises'
import path from 'path'
import type {
  OfficeInstallChoice,
  OfficeProductInfo,
  OfficeStatus,
  CommandExecutionResult
} from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured, openTool } from './commandRunner.service'
import { cachedQuery } from './cache'
import { runExclusive } from './winget.service'
import { logger } from './logger.service'

// A single, fixed PowerShell script (no interpolated user input) that reads
// the uninstall registry keys and prints Office-related entries as JSON.
const DETECT_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
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

const officeStatus = cachedQuery(60 * 1000, readOffice)

export function detectOffice(force = false): Promise<OfficeStatus> {
  return officeStatus.get(force)
}

async function readOffice(): Promise<OfficeStatus> {
  if (!isWindows) {
    return { installed: false, products: [], licenseStatus: null }
  }

  const result = await runCaptured(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', DETECT_SCRIPT],
    { quiet: true }
  )
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

  // Only look for ospp.vbs when Office is actually installed.
  const licenseStatus = products.length > 0 ? await getOfficeLicenseStatus() : null

  return { installed: products.length > 0, products, licenseStatus }
}

async function getOfficeLicenseStatus(): Promise<string | null> {
  // Office ships ospp.vbs directly under its versioned folder
  // (Office16/Office15/Office14). Probing those fixed paths is instant,
  // whereas the previous recursive search walked all of Office's files.
  const roots = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)']].filter(
    (r): r is string => !!r
  )
  const candidates = roots.flatMap((root) =>
    ['Office16', 'Office15', 'Office14'].map((v) =>
      path.join(root, 'Microsoft Office', v, 'ospp.vbs')
    )
  )
  let osppPath: string | null = null
  for (const candidate of candidates) {
    const exists = await fs.access(candidate).then(
      () => true,
      () => false
    )
    if (exists) {
      osppPath = candidate
      break
    }
  }
  if (!osppPath) return null

  const statusResult = await runCaptured('cscript.exe', ['//Nologo', osppPath, '/dstatus'], {
    quiet: true
  })
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
// There is no "Office LTSC" package in winget: Microsoft distributes LTSC
// only through the Office Deployment Tool plus a configuration file made in
// the Office Customization Tool (config.office.com). The LTSC option
// therefore installs ODT and opens that official page.
const OFFICE_CUSTOMIZATION_TOOL_URL = 'https://config.office.com/deploymentsettings'

export async function installOffice(choice: OfficeInstallChoice): Promise<CommandExecutionResult> {
  if (!isWindows) {
    return {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: 'La instalación de Office solo está disponible en Windows.',
      command: 'winget'
    }
  }
  const wingetId = choice === 'microsoft365' ? 'Microsoft.Office' : 'Microsoft.OfficeDeploymentTool'
  logger.info(`Iniciando instalación de Office (${choice}) mediante winget: ${wingetId}`)
  const result = await runExclusive(() =>
    runCaptured(
      'winget',
      [
        'install',
        '--id',
        wingetId,
        '--exact',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity'
      ],
      { timeoutMs: 20 * 60 * 1000, stream: true }
    )
  )
  officeStatus.invalidate()

  if (choice === 'office-ltsc' && result.success) {
    logger.success('Office Deployment Tool instalada.')
    logger.info(
      'Para instalar Office LTSC: crea el archivo de configuración con tu licencia por volumen en la Office Customization Tool (se abre ahora) y ejecuta "setup.exe /configure config.xml" de la Office Deployment Tool.'
    )
    await openTool('cmd.exe', ['/c', 'start', '', OFFICE_CUSTOMIZATION_TOOL_URL]).catch(() => {})
  }
  return result
}
