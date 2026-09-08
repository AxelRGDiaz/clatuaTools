import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import type { MaintenanceAction } from '../../../shared/types'
import { runMaintenanceAction } from '../../services/maintenance.service'

export function registerMaintenanceHandlers(): void {
  ipcMain.handle(IpcChannels.maintenanceRun, (_event, action: MaintenanceAction) =>
    runMaintenanceAction(action)
  )
}
