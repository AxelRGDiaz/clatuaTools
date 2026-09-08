import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import {
  getVendorLinks,
  listDriverProblems,
  openDeviceManager
} from '../../services/drivers.service'

export function registerDriversHandlers(): void {
  ipcMain.handle(IpcChannels.driversListProblems, () => listDriverProblems())
  ipcMain.handle(IpcChannels.driversGetVendorLinks, () => getVendorLinks())
  ipcMain.handle(IpcChannels.driversOpenDeviceManager, () => openDeviceManager())
}
