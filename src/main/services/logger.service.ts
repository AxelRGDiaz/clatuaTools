// Central logging service. Keeps an in-memory ring buffer and emits events
// that main/index.ts forwards to the renderer over IPC. Decoupled from
// Electron/BrowserWindow so it can be imported by any service without
// creating import cycles.

import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'
import type { LogEntry, LogLevel } from '../../shared/types'

const MAX_ENTRIES = 2000

class LoggerService extends EventEmitter {
  private entries: LogEntry[] = []

  private push(level: LogLevel, message: string, detail?: string): LogEntry {
    const entry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
      detail
    }
    this.entries.push(entry)
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift()
    }
    this.emit('entry', entry)
    return entry
  }

  info(message: string, detail?: string): LogEntry {
    return this.push('INFO', message, detail)
  }

  success(message: string, detail?: string): LogEntry {
    return this.push('SUCCESS', message, detail)
  }

  warning(message: string, detail?: string): LogEntry {
    return this.push('WARNING', message, detail)
  }

  error(message: string, detail?: string): LogEntry {
    return this.push('ERROR', message, detail)
  }

  getAll(): LogEntry[] {
    return [...this.entries]
  }

  clear(): void {
    this.entries = []
  }
}

export const logger = new LoggerService()
