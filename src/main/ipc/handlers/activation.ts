import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import {
  checkActivation,
  openActivationSettings,
  runActivationDiagnostic
} from '../../services/activation.service'

export function registerActivationHandlers(): void {
  ipcMain.handle(IpcChannels.activationCheck, (_event, force?: unknown) =>
    checkActivation(force === true)
  )
  ipcMain.handle(IpcChannels.activationOpenSettings, () => openActivationSettings())
  ipcMain.handle(IpcChannels.activationRunDiagnostic, () => runActivationDiagnostic())
}
