// Preload script: the ONLY bridge between the isolated renderer and the
// main process. contextIsolation is on and nodeIntegration is off (see
// electron.vite.config.ts / BrowserWindow webPreferences in main/index.ts),
// so nothing here is reachable by page scripts except what we explicitly
// attach to `window.api`. Every exposed function maps 1:1 to a channel
// from shared/ipc-channels.ts and forwards typed arguments only — there is
// no generic "invoke(channel, ...args)" passthrough, which is what would
// let a compromised renderer call arbitrary main-process behavior.

import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../shared/ipc-channels'
import type {
  AppSettings,
  LogEntry,
  MaintenanceAction,
  OfficeInstallChoice,
  QuickToolId,
  WindowsRepairAction
} from '../shared/types'

const api = {
  system: {
    getSnapshot: () => ipcRenderer.invoke(IpcChannels.systemGetSnapshot),
    ping: (host: string) => ipcRenderer.invoke(IpcChannels.systemPing, host),
    dnsLookup: (host: string) => ipcRenderer.invoke(IpcChannels.systemDnsLookup, host)
  },
  admin: {
    isElevated: () => ipcRenderer.invoke(IpcChannels.adminIsElevated),
    relaunchAsAdmin: () => ipcRenderer.invoke(IpcChannels.adminRelaunch)
  },
  programs: {
    checkWinget: () => ipcRenderer.invoke(IpcChannels.wingetCheck),
    list: () => ipcRenderer.invoke(IpcChannels.programsList),
    checkInstalled: (appId: string) =>
      ipcRenderer.invoke(IpcChannels.programsCheckInstalled, appId),
    installOne: (appId: string) => ipcRenderer.invoke(IpcChannels.programsInstallOne, appId),
    installBatch: (appIds: string[]) =>
      ipcRenderer.invoke(IpcChannels.programsInstallBatch, appIds),
    onInstallProgress: (callback: (result: import('../shared/types').InstallResult) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        result: import('../shared/types').InstallResult
      ): void => callback(result)
      ipcRenderer.on(IpcChannels.programsInstallProgress, listener)
      return () => {
        ipcRenderer.removeListener(IpcChannels.programsInstallProgress, listener)
      }
    }
  },
  windows: {
    runRepair: (action: WindowsRepairAction) =>
      ipcRenderer.invoke(IpcChannels.windowsRunRepair, action),
    openTool: (tool: QuickToolId) => ipcRenderer.invoke(IpcChannels.windowsOpenTool, tool)
  },
  maintenance: {
    run: (action: MaintenanceAction) => ipcRenderer.invoke(IpcChannels.maintenanceRun, action)
  },
  office: {
    detect: () => ipcRenderer.invoke(IpcChannels.officeDetect),
    install: (choice: OfficeInstallChoice) => ipcRenderer.invoke(IpcChannels.officeInstall, choice),
    openActivation: () => ipcRenderer.invoke(IpcChannels.officeOpenActivation)
  },
  activation: {
    check: () => ipcRenderer.invoke(IpcChannels.activationCheck),
    openSettings: () => ipcRenderer.invoke(IpcChannels.activationOpenSettings),
    runDiagnostic: () => ipcRenderer.invoke(IpcChannels.activationRunDiagnostic)
  },
  drivers: {
    listProblems: () => ipcRenderer.invoke(IpcChannels.driversListProblems),
    getVendorLinks: () => ipcRenderer.invoke(IpcChannels.driversGetVendorLinks),
    openDeviceManager: () => ipcRenderer.invoke(IpcChannels.driversOpenDeviceManager)
  },
  logs: {
    save: (entries: LogEntry[]) => ipcRenderer.invoke(IpcChannels.logsSave, entries),
    onEntry: (callback: (entry: LogEntry) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, entry: LogEntry): void => callback(entry)
      ipcRenderer.on(IpcChannels.logsAppend, listener)
      return () => {
        ipcRenderer.removeListener(IpcChannels.logsAppend, listener)
      }
    }
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcChannels.settingsGet),
    set: (partial: Partial<AppSettings>) => ipcRenderer.invoke(IpcChannels.settingsSet, partial)
  }
}

export type ClatuaApi = typeof api

// This app always runs with contextIsolation: true (see BrowserWindow
// webPreferences in main/index.ts) — contextBridge is the only supported
// path, so there is no nodeIntegration fallback to fall back to.
try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}
