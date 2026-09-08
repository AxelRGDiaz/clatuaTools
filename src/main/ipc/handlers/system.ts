import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import { getSystemSnapshot } from '../../services/systemInfo.service'
import { pingHost, dnsLookup } from '../../services/network.service'

export function registerSystemHandlers(): void {
  ipcMain.handle(IpcChannels.systemGetSnapshot, () => getSystemSnapshot())
  ipcMain.handle(IpcChannels.systemPing, (_event, host: string) => pingHost(host))
  ipcMain.handle(IpcChannels.systemDnsLookup, (_event, host: string) => dnsLookup(host))
}
