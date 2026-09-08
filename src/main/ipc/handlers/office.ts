import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import type { OfficeInstallChoice } from '../../../shared/types'
import { detectOffice, installOffice, openOfficeActivation } from '../../services/office.service'

export function registerOfficeHandlers(): void {
  ipcMain.handle(IpcChannels.officeDetect, () => detectOffice())
  ipcMain.handle(IpcChannels.officeInstall, (_event, choice: OfficeInstallChoice) =>
    installOffice(choice)
  )
  ipcMain.handle(IpcChannels.officeOpenActivation, () => openOfficeActivation())
}
