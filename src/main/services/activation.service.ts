// Reads Windows activation status using only official, read-only Windows
// data (the SoftwareLicensingProduct WMI class — the same source slmgr.vbs
// reads). Never implements bypass, KMS emulation, or license patching of
// any kind — see office.service.ts for the same policy on the Office side.
//
// WMI is queried instead of parsing `slmgr /dlv` text because that output
// is localized ("License Status" vs "Estado de la licencia"…) and printed
// in the OEM code page, which broke detection on non-English Windows.

import type { ActivationStatus, CommandExecutionResult } from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured, openTool } from './commandRunner.service'
import { cachedQuery } from './cache'
import { logger } from './logger.service'

// Windows' licensing ApplicationID (fixed GUID, same on every install).
const LICENSE_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Get-CimInstance SoftwareLicensingProduct -Filter "ApplicationID='55c92734-d682-4d71-983e-d6ec3f16059f' AND PartialProductKey IS NOT NULL" |
  Select-Object -First 1 Name, Description, LicenseStatus, PartialProductKey, GracePeriodRemaining |
  ConvertTo-Json -Compress
`.trim()

const LICENSE_STATUS_LABELS: Record<number, string> = {
  0: 'Sin licencia',
  1: 'Con licencia',
  2: 'Periodo de gracia inicial',
  3: 'Periodo de gracia adicional',
  4: 'Periodo de gracia (no original)',
  5: 'Notificación',
  6: 'Periodo de gracia extendido'
}

interface LicenseRow {
  Name?: string
  Description?: string
  LicenseStatus?: number
  PartialProductKey?: string
  GracePeriodRemaining?: number
}

const activation = cachedQuery(60 * 1000, readActivation)

export function checkActivation(force = false): Promise<ActivationStatus> {
  return activation.get(force)
}

async function readActivation(): Promise<ActivationStatus> {
  if (!isWindows) {
    return {
      edition: null,
      licenseStatus: 'Desconocido (no es Windows)',
      licenseChannel: null,
      partialProductKey: null,
      isActivated: false,
      raw: ''
    }
  }

  const result = await runCaptured(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', LICENSE_SCRIPT],
    { quiet: true }
  )

  let row: LicenseRow | null = null
  try {
    row = result.stdout.trim() ? (JSON.parse(result.stdout.trim()) as LicenseRow) : null
  } catch {
    row = null
  }

  if (!row) {
    return {
      edition: null,
      licenseStatus: 'No se encontró una clave de producto instalada',
      licenseChannel: null,
      partialProductKey: null,
      isActivated: false,
      raw: result.stdout || result.stderr
    }
  }

  const status = typeof row.LicenseStatus === 'number' ? row.LicenseStatus : -1
  const isActivated = status === 1
  // Description looks like "Windows(R) Operating System, RETAIL channel".
  const channel = row.Description?.match(/,\s*([^,]+?)\s+channel/i)?.[1] ?? row.Description ?? null
  const grace =
    !isActivated && row.GracePeriodRemaining
      ? ` (${Math.round(row.GracePeriodRemaining / 60 / 24)} días restantes)`
      : ''

  return {
    edition: row.Name ?? null,
    licenseStatus: (LICENSE_STATUS_LABELS[status] ?? 'Desconocido') + grace,
    licenseChannel: channel,
    partialProductKey: row.PartialProductKey ?? null,
    isActivated,
    raw: result.stdout.trim()
  }
}

export function openActivationSettings(): Promise<void> {
  logger.info('Abriendo la configuración de activación de Windows…')
  return openTool('cmd.exe', ['/c', 'start', '', 'ms-settings:activation'])
}

export function runActivationDiagnostic(): Promise<CommandExecutionResult> {
  logger.info('Ejecutando el solucionador de problemas de activación de Windows…')
  return runCaptured('cmd.exe', ['/c', 'start', '', 'ms-settings:troubleshoot'])
}
