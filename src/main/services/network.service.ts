// Network diagnostic commands (ping, DNS lookup). The host/IP the user
// types is validated against a strict hostname/IP pattern before ever
// reaching execFile — it is passed as a single argv element (never shell
// interpolated), and the whitelist pattern additionally blocks anything
// that isn't a plausible hostname or IP literal.

import type { CommandExecutionResult } from '../../shared/types'
import { isWindows } from '../security/platform'
import { runCaptured } from './commandRunner.service'

// Plausible hostname or IPv4/IPv6 literal. Rejects shell metacharacters,
// spaces, flags (leading "-"), etc.
const HOST_PATTERN = /^(?!-)[A-Za-z0-9.:_-]{1,253}$/

export function isValidHost(host: string): boolean {
  return HOST_PATTERN.test(host)
}

export async function pingHost(host: string): Promise<CommandExecutionResult> {
  if (!isValidHost(host)) {
    return {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: 'Host no válido.',
      command: 'ping'
    }
  }
  const args = isWindows ? ['-n', '4', host] : ['-c', '4', host]
  return runCaptured('ping', args, { timeoutMs: 20_000 })
}

export async function dnsLookup(host: string): Promise<CommandExecutionResult> {
  if (!isValidHost(host)) {
    return {
      success: false,
      exitCode: null,
      stdout: '',
      stderr: 'Host no válido.',
      command: 'nslookup'
    }
  }
  return runCaptured('nslookup', [host], { timeoutMs: 15_000 })
}
