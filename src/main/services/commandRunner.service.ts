// The ONLY place in the app that talks to child_process. Every call goes
// through execFile/spawn with an argv array — never a shell string — so
// there is no path from any input (whitelisted or otherwise) to shell
// interpolation / command injection.

import { spawn } from 'child_process'
import type { CommandExecutionResult } from '../../shared/types'
import { logger } from './logger.service'

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes, generous for DISM/winget
const MAX_OUTPUT_BYTES = 1024 * 1024 * 32

export interface RunOptions {
  timeoutMs?: number
  cwd?: string
  /**
   * Forward each output line to the log panel while the command runs. Used
   * for long operations (SFC, DISM, winget install) so the technician sees
   * progress instead of a silent spinner for several minutes.
   */
  stream?: boolean
  /** Don't log the command itself (for internal background queries). */
  quiet?: boolean
}

/**
 * sfc.exe (and a few other system tools) write UTF-16LE when their output
 * is redirected; everything else writes UTF-8/ANSI. Detect UTF-16 by the
 * proportion of NUL bytes instead of trusting the console code page.
 */
// Bytes 0x80-0xFF of code page 850 (0xF0 is a soft hyphen and 0xFF a
// no-break space, added by char code to keep the source free of invisible
// characters).
const CP850_HIGH =
  'ÇüéâäàåçêëèïîìÄÅ' +
  'ÉæÆôöòûùÿÖÜø£Ø×ƒ' +
  'áíóúñÑªº¿®¬½¼¡«»' +
  '░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐' +
  '└┴┬├─┼ãÃ╚╔╩╦╠═╬¤' +
  'ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀' +
  'ÓßÔÒõÕµþÞÚÛÙýÝ¯´' +
  String.fromCharCode(0xad) +
  '±‗¾¶§÷¸°¨·¹³²■' +
  String.fromCharCode(0xa0)

function decodeCp850(buffer: Buffer): string {
  let out = ''
  for (const byte of buffer)
    out += byte < 0x80 ? String.fromCharCode(byte) : CP850_HIGH[byte - 0x80]
  return out
}

function decodeOutput(buffer: Buffer): string {
  if (buffer.length === 0) return ''
  let nulCount = 0
  const sample = Math.min(buffer.length, 512)
  for (let i = 1; i < sample; i += 2) if (buffer[i] === 0) nulCount++
  let text = nulCount > sample / 4 ? buffer.toString('utf16le') : buffer.toString('utf8')
  // Console tools (ping, chkdsk, nslookup…) print in the OEM code page, so
  // accented text isn't valid UTF-8 ("M�nimo"). Fall back to CP850, the OEM
  // page of Spanish/Latin American Windows.
  if (text.includes(String.fromCharCode(0xfffd))) text = decodeCp850(buffer)
  const clean = text.split(String.fromCharCode(0)).join('')
  return clean.charCodeAt(0) === 0xfeff ? clean.slice(1) : clean // strip BOM
}

/**
 * Runs a command via spawn (no shell) and captures stdout/stderr.
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
  if (!options.quiet) logger.info(`Ejecutando: ${commandLabel}`)

  return new Promise((resolve) => {
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    let outputBytes = 0
    let timedOut = false
    let lastStreamed = ''
    let settled = false

    const child = spawn(exe, args, { cwd: options.cwd, windowsHide: true, shell: false })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

    const collect = (target: Buffer[]) => (chunk: Buffer) => {
      if (outputBytes >= MAX_OUTPUT_BYTES) return
      outputBytes += chunk.length
      target.push(chunk)
      if (options.stream) {
        // Progress bars (SFC/DISM/winget) redraw the same line with \r, so
        // split on both and skip blank lines and immediate repeats.
        for (const raw of decodeOutput(chunk).split(/[\r\n]+/)) {
          const line = raw.trim()
          if (line.length < 2 || line === lastStreamed) continue
          lastStreamed = line
          logger.info(line)
        }
      }
    }
    child.stdout.on('data', collect(stdoutChunks))
    child.stderr.on('data', collect(stderrChunks))

    const finish = (exitCode: number | null, errorMessage?: string): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const success = !errorMessage && !timedOut && exitCode === 0
      const result: CommandExecutionResult = {
        success,
        exitCode,
        stdout: decodeOutput(Buffer.concat(stdoutChunks)),
        stderr: decodeOutput(Buffer.concat(stderrChunks)),
        command: commandLabel
      }
      if (success) {
        if (!options.quiet) logger.success(`Comando completado: ${commandLabel}`)
      } else {
        const reason =
          errorMessage ?? (timedOut ? 'tiempo de espera agotado' : `código de salida ${exitCode}`)
        if (!options.quiet) logger.error(`Fallo al ejecutar "${commandLabel}": ${reason}`)
        if (!result.stderr && errorMessage) result.stderr = errorMessage
      }
      resolve(result)
    }

    child.once('error', (err) => finish(null, err.message))
    child.once('close', (code) => finish(code))
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

/** Human explanation for the launch errors technicians actually hit. */
function describeSpawnError(err: NodeJS.ErrnoException): string {
  if (err.code === 'EPERM' || err.code === 'EACCES') {
    return 'Windows o el antivirus bloqueó la ejecución (revisa el historial de protección de Windows Security).'
  }
  if (err.code === 'ENOENT') {
    return 'El programa no está instalado o no se encontró en este equipo.'
  }
  return err.message
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
      logger.error(`No se pudo abrir "${exe}" elevado: ${describeSpawnError(err)}`)
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
      logger.error(`No se pudo abrir "${exe}": ${describeSpawnError(err)}`)
      reject(err)
    })
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}
