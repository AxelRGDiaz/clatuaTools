// Opens the "quick tools" — native Windows utilities — strictly through the
// QUICK_TOOL_COMMANDS whitelist. The renderer only ever sends a QuickToolId
// enum value; it never controls the executable path or arguments.

import type { QuickToolId } from '../../shared/types'
import { QUICK_TOOL_COMMANDS } from '../security/commandWhitelist'
import { isWindows } from '../security/platform'
import { openElevated, openTool } from './commandRunner.service'
import { logger } from './logger.service'

export async function openQuickTool(tool: QuickToolId): Promise<void> {
  const spec = QUICK_TOOL_COMMANDS[tool]
  if (!spec) {
    logger.error(`Herramienta desconocida: ${tool}`)
    throw new Error(`Herramienta desconocida: ${tool}`)
  }

  if (!isWindows) {
    logger.warning(`"${tool}" solo está disponible en Windows.`)
    return
  }

  if (spec.requiresAdmin) {
    await openElevated(spec.exe, spec.args)
  } else {
    await openTool(spec.exe, spec.args)
  }
}
