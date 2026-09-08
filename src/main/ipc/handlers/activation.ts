import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import {
  checkActivation,
  openActivationSettings,
  runActivationDiagnostic
} from '../../services/activation.service'

export function registerActivationHandlers(): void {
  ipcMain.handle(IpcChannels.activationCheck, () => checkActivation())
  ipcMain.handle(IpcChannels.activationOpenSettings, () => openActivationSettings())
  ipcMain.handle(IpcChannels.activationRunDiagnostic, () => runActivationDiagnostic())
}
