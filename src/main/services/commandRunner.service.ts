// The ONLY place in the app that talks to child_process. Every call goes
// through execFile/spawn with an argv array — never a shell string — so
// there is no path from any input (whitelisted or otherwise) to shell
// interpolation / command injection.

import { execFile, spawn } from 'child_process'
import type { CommandExecutionResult } from '../../shared/types'
import { logger } from './logger.service'

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes, generous for DISM/winget

export interface RunOptions {
  timeoutMs?: number
  cwd?: string
}

/**
 * Runs a command via execFile (no shell) and captures stdout/stderr.
 * `exe` and `args` must always come from a static whitelist entry or a
 * value that has already been validated (e.g. a winget id matched against
 * apps.json) — never directly from unvalidated renderer input.
 */
export function runCaptured(
  exe: string,
  args: string[],
  options: RunOptions = {}
): Promise<CommandExecutionResult> {
  const commandLabel = [exe, ...args].join(' ')
  logger.info(`Ejecutando: ${commandLabel}`)

  return new Promise((resolve) => {
    execFile(
      exe,
      args,
      {
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        cwd: options.cwd,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 32
      },
      (error, stdout, stderr) => {
        const exitCode = error && typeof error.code === 'number' ? error.code : error ? 1 : 0
        const result: CommandExecutionResult = {
          success: !error,
          exitCode: error ? exitCode : 0,
          stdout: stdout?.toString() ?? '',
          stderr: stderr?.toString() ?? '',
          command: commandLabel
        }
        if (error) {
          logger.error(`Fallo al ejecutar "${commandLabel}": ${error.message}`)
        } else {
          logger.success(`Comando completado: ${commandLabel}`)
        }
        resolve(result)
      }
    )
  })
}

function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''")
}

function buildPsArgumentList(args: string[]): string {
  if (args.length === 0) return ''
  const quoted = args.map((a) => `'${escapePowerShellSingleQuoted(a)}'`).join(',')
  return `-ArgumentList ${quoted}`
}

/**
 * Launches a process elevated (UAC prompt) as a detached, interactive
 * window. Used for opening interactive elevated tools (cmd, powershell,
 * regedit) where we don't need to capture output. `exe`/`args` must come
 * from the static QUICK_TOOL_COMMANDS whitelist.
 */
export function openElevated(exe: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = escapePowerShellSingleQuoted(exe)
    const argList = buildPsArgumentList(args)
    const script = `Start-Process -FilePath '${filePath}' ${argList} -Verb RunAs`.trim()

    logger.info(`Abriendo elevado: ${exe} ${args.join(' ')}`)

    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', script],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }
    )

    child.once('error', (err) => {
      logger.error(`No se pudo abrir "${exe}" elevado: ${err.message}`)
      reject(err)
    })
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}

/** Launches a non-elevated interactive tool (e.g. taskmgr.exe, control.exe). */
export function openTool(exe: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info(`Abriendo: ${exe} ${args.join(' ')}`)
    const child = spawn(exe, args, { detached: true, stdio: 'ignore', windowsHide: false })
    child.once('error', (err) => {
      logger.error(`No se pudo abrir "${exe}": ${err.message}`)
      reject(err)
    })
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}
