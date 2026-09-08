// Detects whether the current process holds administrative privileges and
// can relaunch the whole app elevated via UAC. We elevate the *whole app*
// rather than trying to elevate individual commands one-by-one: Windows'
// `Start-Process -Verb RunAs` cannot redirect stdout/stderr of the elevated
// child, so per-command elevation would make it impossible to capture
// output for things like SFC/DISM. Running the app itself elevated means
// every child process it spawns inherits the elevated token.

import { app } from 'electron'
import { execFile, spawn } from 'child_process'
import { isWindows } from '../security/platform'
import { logger } from './logger.service'

export function isElevated(): Promise<boolean> {
  if (!isWindows) {
    // Dev/build host (macOS/Linux): never "elevated", but never blocks the UI either.
    return Promise.resolve(false)
  }
  return new Promise((resolve) => {
    // `net session` only succeeds without error when run from an elevated process.
    execFile('net.exe', ['session'], { windowsHide: true, timeout: 5000 }, (error) => {
      resolve(!error)
    })
  })
}

export function relaunchAsAdmin(): void {
  if (!isWindows) {
    logger.warning('Reiniciar como administrador solo está disponible en Windows.')
    return
  }

  const exePath = process.execPath
  // In production (packaged) argv[0] is the exe itself; in dev it's electron
  // plus the entry script. Preserve any extra args so the relaunch behaves
  // the same, but drop argv[0].
  const extraArgs = process.argv.slice(1)

  const escaped = (v: string): string => v.replace(/'/g, "''")
  const argList =
    extraArgs.length > 0
      ? `-ArgumentList ${extraArgs.map((a) => `'${escaped(a)}'`).join(',')} `
      : ''
  const script = `Start-Process -FilePath '${escaped(exePath)}' ${argList}-Verb RunAs`

  logger.info('Reiniciando la aplicación con privilegios de administrador…')

  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', script],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    }
  )
  child.once('spawn', () => {
    child.unref()
    app.exit(0)
  })
  child.once('error', (err) => {
    logger.error(`No se pudo reiniciar como administrador: ${err.message}`)
  })
}
