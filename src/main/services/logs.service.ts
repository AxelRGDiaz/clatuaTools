// Saves the log panel contents to a .txt file chosen by the user via the
// native save dialog (no arbitrary path from the renderer is ever trusted).

import { dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import type { LogEntry } from '../../shared/types'

function formatEntry(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level}] ${entry.message}${entry.detail ? `\n    ${entry.detail}` : ''}`
}

export async function saveLogsToFile(
  entries: LogEntry[],
  parentWindow: BrowserWindow | null
): Promise<string> {
  const defaultName = `clatuatech-tools-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`

  const { canceled, filePath } = parentWindow
    ? await dialog.showSaveDialog(parentWindow, {
        defaultPath: defaultName,
        filters: [{ name: 'Texto', extensions: ['txt'] }]
      })
    : await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: 'Texto', extensions: ['txt'] }]
      })

  if (canceled || !filePath) {
    return ''
  }

  const content = entries.map(formatEntry).join('\n')
  await fs.writeFile(filePath, content, 'utf-8')
  return filePath
}
