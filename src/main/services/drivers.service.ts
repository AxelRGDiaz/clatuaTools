// Lists devices with driver problems using PnP WMI data (read-only) and
// exposes the configurable vendor download links. Never downloads or
// installs a driver binary from a third-party source.

import type { DriverProblem, VendorLink } from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured, openTool } from './commandRunner.service'
import { logger } from './logger.service'
import driverLinksConfig from '../config/driverLinks.json'

const PROBLEM_DEVICES_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 } | ForEach-Object {
  [PSCustomObject]@{
    Name = $_.Name
    DeviceId = $_.DeviceID
    Manufacturer = $_.Manufacturer
    ErrorCode = $_.ConfigManagerErrorCode
    Status = $_.Status
  }
} | ConvertTo-Json -Compress
`.trim()

export async function listDriverProblems(): Promise<DriverProblem[]> {
  if (!isWindows) return []

  const result = await runCaptured('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    PROBLEM_DEVICES_SCRIPT
  ])
  if (!result.success || !result.stdout.trim()) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(result.stdout.trim())
  } catch {
    return []
  }

  const rawList = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  return rawList
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({
      deviceName: String(r.Name ?? 'Dispositivo desconocido'),
      deviceId: String(r.DeviceId ?? ''),
      manufacturer: typeof r.Manufacturer === 'string' ? r.Manufacturer : null,
      errorCode: typeof r.ErrorCode === 'number' ? r.ErrorCode : null,
      status: String(r.Status ?? '')
    }))
}

export function getVendorLinks(): VendorLink[] {
  return driverLinksConfig as VendorLink[]
}

export function openDeviceManager(): Promise<void> {
  logger.info('Abriendo el Administrador de dispositivos…')
  return openTool('devmgmt.msc', [])
}
