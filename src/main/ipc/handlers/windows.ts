import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import type { QuickToolId, WindowsRepairAction } from '../../../shared/types'
import { runWindowsRepair } from '../../services/windows.service'
import { openQuickTool } from '../../services/quickTools.service'

export function registerWindowsHandlers(): void {
  ipcMain.handle(IpcChannels.windowsRunRepair, (_event, action: WindowsRepairAction) =>
    runWindowsRepair(action)
  )
  ipcMain.handle(IpcChannels.windowsOpenTool, (_event, tool: QuickToolId) => openQuickTool(tool))
}
