import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import {
  checkWingetAvailable,
  isAppInstalled,
  installApp,
  installBatch,
  listApps
} from '../../services/winget.service'
import type { InstallResult } from '../../../shared/types'

export function registerProgramsHandlers(): void {
  ipcMain.handle(IpcChannels.wingetCheck, () => checkWingetAvailable())
  ipcMain.handle(IpcChannels.programsList, () => listApps())
  ipcMain.handle(IpcChannels.programsCheckInstalled, (_event, appId: string) =>
    isAppInstalled(appId)
  )
  ipcMain.handle(IpcChannels.programsInstallOne, (_event, appId: string) => installApp(appId))

  ipcMain.handle(IpcChannels.programsInstallBatch, async (event, appIds: string[]) => {
    const results: InstallResult[] = await installBatch(appIds, (result) => {
      event.sender.send(IpcChannels.programsInstallProgress, result)
    })
    return results
  })
}
