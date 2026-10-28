import { ipcMain, BrowserWindow } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import type { LogEntry } from '../../../shared/types'
import { saveLogsToFile } from '../../services/logs.service'
import { logger } from '../../services/logger.service'

export function registerLogsHandlers(): void {
  ipcMain.handle(IpcChannels.logsGetAll, () => logger.getAll())
  ipcMain.handle(IpcChannels.logsSave, (event, entries: LogEntry[]) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return saveLogsToFile(entries, win)
  })
}
