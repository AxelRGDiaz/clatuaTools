import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import { isElevated, relaunchAsAdmin } from '../../services/admin.service'

export function registerAdminHandlers(): void {
  ipcMain.handle(IpcChannels.adminIsElevated, () => isElevated())
  ipcMain.handle(IpcChannels.adminRelaunch, () => {
    relaunchAsAdmin()
  })
}
