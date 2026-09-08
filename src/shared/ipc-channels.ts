// Central contract for every IPC channel exposed to the renderer.
// The renderer NEVER sends free-form commands — every channel here takes a
// narrow, typed payload that the main process validates against a whitelist
// before touching the operating system. See src/main/security/commandWhitelist.ts.

import type {
  ActivationStatus,
  AppEntry,
  AppSettings,
  CommandExecutionResult,
  DriverProblem,
  InstallResult,
  LogEntry,
  MaintenanceAction,
  MaintenanceActionResult,
  OfficeInstallChoice,
  OfficeStatus,
  QuickToolId,
  SystemSnapshot,
  VendorLink,
  WindowsRepairAction,
  WingetStatus
} from './types'

export const IpcChannels = {
  // system
  systemGetSnapshot: 'system:getSnapshot',
  systemPing: 'system:ping',
  systemDnsLookup: 'system:dnsLookup',

  // admin
  adminIsElevated: 'admin:isElevated',
  adminRelaunch: 'admin:relaunchAsAdmin',

  // programs / winget
  wingetCheck: 'winget:check',
  programsList: 'programs:list',
  programsCheckInstalled: 'programs:checkInstalled',
  programsInstallOne: 'programs:installOne',
  programsInstallBatch: 'programs:installBatch',
  programsInstallProgress: 'programs:installProgress', // main -> renderer event

  // windows repair
  windowsRunRepair: 'windows:runRepair',
  windowsOpenTool: 'windows:openTool',

  // maintenance
  maintenanceRun: 'maintenance:run',

  // office
  officeDetect: 'office:detect',
  officeInstall: 'office:install',
  officeOpenActivation: 'office:openActivation',

  // activation
  activationCheck: 'activation:check',
  activationOpenSettings: 'activation:openSettings',
  activationRunDiagnostic: 'activation:runDiagnostic',

  // drivers
  driversListProblems: 'drivers:listProblems',
  driversGetVendorLinks: 'drivers:getVendorLinks',
  driversOpenDeviceManager: 'drivers:openDeviceManager',

  // logs
  logsAppend: 'logs:append', // main -> renderer event
  logsSave: 'logs:save',

  // settings
  settingsGet: 'settings:get',
  settingsSet: 'settings:set'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

// Request/response typing for invoke-style channels, used to keep preload
// and renderer call sites type-safe.
export interface IpcApi {
  [IpcChannels.systemGetSnapshot]: { args: []; result: SystemSnapshot }
  [IpcChannels.systemPing]: { args: [host: string]; result: CommandExecutionResult }
  [IpcChannels.systemDnsLookup]: { args: [host: string]; result: CommandExecutionResult }

  [IpcChannels.adminIsElevated]: { args: []; result: boolean }
  [IpcChannels.adminRelaunch]: { args: []; result: void }

  [IpcChannels.wingetCheck]: { args: []; result: WingetStatus }
  [IpcChannels.programsList]: { args: []; result: AppEntry[] }
  [IpcChannels.programsCheckInstalled]: { args: [appId: string]; result: boolean }
  [IpcChannels.programsInstallOne]: { args: [appId: string]; result: InstallResult }
  [IpcChannels.programsInstallBatch]: { args: [appIds: string[]]; result: InstallResult[] }

  [IpcChannels.windowsRunRepair]: {
    args: [action: WindowsRepairAction]
    result: CommandExecutionResult
  }
  [IpcChannels.windowsOpenTool]: { args: [tool: QuickToolId]; result: void }

  [IpcChannels.maintenanceRun]: {
    args: [action: MaintenanceAction]
    result: MaintenanceActionResult
  }

  [IpcChannels.officeDetect]: { args: []; result: OfficeStatus }
  [IpcChannels.officeInstall]: {
    args: [choice: OfficeInstallChoice]
    result: CommandExecutionResult
  }
  [IpcChannels.officeOpenActivation]: { args: []; result: void }

  [IpcChannels.activationCheck]: { args: []; result: ActivationStatus }
  [IpcChannels.activationOpenSettings]: { args: []; result: void }
  [IpcChannels.activationRunDiagnostic]: { args: []; result: CommandExecutionResult }

  [IpcChannels.driversListProblems]: { args: []; result: DriverProblem[] }
  [IpcChannels.driversGetVendorLinks]: { args: []; result: VendorLink[] }
  [IpcChannels.driversOpenDeviceManager]: { args: []; result: void }

  [IpcChannels.logsSave]: { args: [entries: LogEntry[]]; result: string }

  [IpcChannels.settingsGet]: { args: []; result: AppSettings }
  [IpcChannels.settingsSet]: { args: [settings: Partial<AppSettings>]; result: AppSettings }
}
