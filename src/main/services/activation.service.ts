// Reads Windows activation status using only official, read-only Windows
// tools (slmgr.vbs /xpr and /dlv, plus WMI). Never implements bypass, KMS
// emulation, or license patching of any kind — see office.service.ts for
// the same policy on the Office side.

import type { ActivationStatus, CommandExecutionResult } from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured, openTool } from './commandRunner.service'
import { logger } from './logger.service'

export async function checkActivation(): Promise<ActivationStatus> {
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

  const [xprResult, dlvResult] = await Promise.all([
    runCaptured('cscript.exe', ['//Nologo', 'C:\\Windows\\System32\\slmgr.vbs', '/xpr']),
    runCaptured('cscript.exe', ['//Nologo', 'C:\\Windows\\System32\\slmgr.vbs', '/dlv'])
  ])

  const raw = `${xprResult.stdout}\n${dlvResult.stdout}`.trim()
  const isActivated =
    /permanently activated|activado de forma permanente|the machine is permanently/i.test(
      xprResult.stdout
    )

  const editionMatch = dlvResult.stdout.match(/Name:\s*(.+)/i)
  const channelMatch = dlvResult.stdout.match(/Description:\s*(.+)/i)
  const keyMatch = dlvResult.stdout.match(/Partial Product Key:\s*(.+)/i)
  const licenseStatusMatch = dlvResult.stdout.match(/License Status:\s*(.+)/i)

  return {
    edition: editionMatch?.[1]?.trim() ?? null,
    licenseStatus: licenseStatusMatch?.[1]?.trim() ?? (isActivated ? 'Activado' : 'No activado'),
    licenseChannel: channelMatch?.[1]?.trim() ?? null,
    partialProductKey: keyMatch?.[1]?.trim() ?? null,
    isActivated,
    raw
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
