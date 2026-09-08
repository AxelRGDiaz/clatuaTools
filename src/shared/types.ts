// Types shared between main, preload and renderer processes.
// Keep this file free of Node/Electron/DOM-specific imports so it can be
// consumed from any of the three worlds.

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  detail?: string
}

// ---------------------------------------------------------------------------
// System information
// ---------------------------------------------------------------------------

export interface CpuInfo {
  manufacturer: string
  brand: string
  cores: number
  physicalCores: number
  speed: number
  currentLoad: number | null
}

export interface RamInfo {
  totalBytes: number
  freeBytes: number
  usedBytes: number
  usedPercent: number
}

export interface GpuInfo {
  model: string
  vendor: string
  vramBytes: number | null
}

export interface DiskInfo {
  device: string
  type: string
  model: string
  sizeBytes: number
  freeBytes: number | null
  mount: string
}

export interface NetworkAdapterInfo {
  iface: string
  ip4: string
  ip6: string
  mac: string
  gateway: string | null
  dns: string[]
  isUp: boolean
}

export interface OsInfo {
  distro: string
  release: string
  build: string
  arch: string
  hostname: string
  uefi: boolean | null
}

export interface BoardInfo {
  manufacturer: string
  model: string
  biosVendor: string
  biosVersion: string
}

export interface SystemSnapshot {
  computerName: string
  currentUser: string
  isAdmin: boolean
  os: OsInfo
  board: BoardInfo
  cpu: CpuInfo
  ram: RamInfo
  gpu: GpuInfo[]
  disks: DiskInfo[]
  network: NetworkAdapterInfo[]
  primaryIp: string | null
  online: boolean
  timestamp: string
}

// ---------------------------------------------------------------------------
// Programs / winget
// ---------------------------------------------------------------------------

export type AppCategory = 'browsers' | 'utilities' | 'development' | 'communication' | 'multimedia'

export interface AppEntry {
  id: string
  name: string
  category: AppCategory
  wingetId: string
  description: string
  quickInstall?: boolean
}

export interface WingetStatus {
  available: boolean
  version: string | null
}

export type InstallStatus = 'pending' | 'checking' | 'installing' | 'success' | 'error' | 'skipped'

export interface InstallProgressEvent {
  appId: string
  status: InstallStatus
  message: string
}

export interface InstallResult {
  appId: string
  appName: string
  success: boolean
  alreadyInstalled: boolean
  message: string
}

// ---------------------------------------------------------------------------
// Windows repair / maintenance
// ---------------------------------------------------------------------------

export type WindowsRepairAction =
  'sfc-scannow' | 'dism-restorehealth' | 'dism-scanhealth' | 'chkdsk'

export type QuickToolId =
  | 'cmd-admin'
  | 'powershell-admin'
  | 'terminal'
  | 'regedit'
  | 'services'
  | 'device-manager'
  | 'disk-management'
  | 'event-viewer'
  | 'task-manager'
  | 'system-information'
  | 'control-panel'
  | 'windows-settings'
  | 'computer-management'
  | 'windows-update'
  | 'local-users'
  | 'firewall'
  | 'system-restore'
  | 'environment-variables'
  | 'storage-sense'

export type MaintenanceAction =
  | 'clean-temp-user'
  | 'clean-temp-windows'
  | 'clean-explorer-cache'
  | 'restart-explorer'
  | 'open-startup-apps'

export interface MaintenanceActionResult {
  action: MaintenanceAction
  success: boolean
  freedBytes?: number
  message: string
}

export interface CommandExecutionResult {
  success: boolean
  exitCode: number | null
  stdout: string
  stderr: string
  command: string
}

// ---------------------------------------------------------------------------
// Office
// ---------------------------------------------------------------------------

export interface OfficeProductInfo {
  name: string
  version: string
  architecture: '32-bit' | '64-bit' | 'unknown'
}

export interface OfficeStatus {
  installed: boolean
  products: OfficeProductInfo[]
  licenseStatus: string | null
}

export type OfficeInstallChoice = 'microsoft365' | 'office-ltsc'

// ---------------------------------------------------------------------------
// Windows activation
// ---------------------------------------------------------------------------

export interface ActivationStatus {
  edition: string | null
  licenseStatus: string
  licenseChannel: string | null
  partialProductKey: string | null
  isActivated: boolean
  raw: string
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export interface DriverProblem {
  deviceName: string
  deviceId: string
  manufacturer: string | null
  errorCode: number | null
  status: string
}

export interface VendorLink {
  vendor: string
  url: string
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AppSettings {
  appName: string
  theme: 'dark' | 'light'
  technicalMode: boolean
  autoStart: boolean
  uacBehavior: 'always-ask' | 'silent-when-possible'
  logRetentionDays: number
}

// ---------------------------------------------------------------------------
// Generic IPC envelope
// ---------------------------------------------------------------------------

export interface IpcResult<T> {
  ok: boolean
  data?: T
  error?: string
}
