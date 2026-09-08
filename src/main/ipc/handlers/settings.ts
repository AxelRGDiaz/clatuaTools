import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import type { AppSettings } from '../../../shared/types'
import { getSettings, setSettings } from '../../services/settings.service'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, () => getSettings())
  ipcMain.handle(IpcChannels.settingsSet, (_event, partial: Partial<AppSettings>) =>
    setSettings(partial)
  )
}
