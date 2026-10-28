// Runs the Windows repair commands (SFC/DISM/CHKDSK). All require the app
// itself to be running elevated — see admin.service.ts for why we elevate
// the whole app instead of per-command RunAs (RunAs can't redirect output).

import type { CommandExecutionResult, WindowsRepairAction } from '../../shared/types'
import { WINDOWS_REPAIR_COMMANDS, lookupSpec } from '../security/commandWhitelist'
import { isElevated } from './admin.service'
import { isWindows } from '../security/platform'
import { runCaptured } from './commandRunner.service'
import { logger } from './logger.service'

export async function runWindowsRepair(
  action: WindowsRepairAction
): Promise<CommandExecutionResult> {
  const spec = lookupSpec(WINDOWS_REPAIR_COMMANDS, action)
  if (!spec) {
    return {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: 'Acción desconocida.',
      command: String(action)
    }
  }

  if (!isWindows) {
    return {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: 'Esta herramienta solo está disponible en Windows.',
      command: action
    }
  }

  if (spec.requiresAdmin && !(await isElevated())) {
    const message =
      'Esta operación requiere privilegios de administrador. Reinicia ClatuaTech Tools como administrador e inténtalo de nuevo.'
    logger.error(message)
    return {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: message,
      command: `${spec.exe} ${spec.args.join(' ')}`
    }
  }

  return runCaptured(spec.exe, spec.args, { timeoutMs: 20 * 60 * 1000, stream: true })
}
