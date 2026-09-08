// Single source of truth for every OS command this application is allowed to
// run. The renderer can only ever select one of these entries by its typed
// key — it can never supply an executable path or raw argument string that
// reaches a shell. This is what keeps command injection impossible: there is
// no code path from renderer input to `exec()`/string-built commands.

import type { MaintenanceAction, QuickToolId, WindowsRepairAction } from '../../shared/types'

export interface CommandSpec {
  /** Executable resolved via PATH (never a user-supplied path). */
  exe: string
  /** Fixed, literal argument list — never built by concatenating user input. */
  args: string[]
  /** Whether this must run in an elevated (UAC) process. */
  requiresAdmin: boolean
  /** Human explanation shown to the user before running anything destructive. */
  description: string
  /** Marks actions that can modify/repair data and need explicit confirmation. */
  dangerous: boolean
}

export const WINDOWS_REPAIR_COMMANDS: Record<WindowsRepairAction, CommandSpec> = {
  'sfc-scannow': {
    exe: 'sfc.exe',
    args: ['/scannow'],
    requiresAdmin: true,
    description:
      'Comprueba la integridad de todos los archivos protegidos del sistema y repara los archivos dañados cuando es posible. Puede tardar varios minutos.',
    dangerous: false
  },
  'dism-restorehealth': {
    exe: 'DISM.exe',
    args: ['/Online', '/Cleanup-Image', '/RestoreHealth'],
    requiresAdmin: true,
    description:
      'Descarga e instala archivos de reparación para la imagen de Windows desde Windows Update. Requiere conexión a internet y puede tardar varios minutos.',
    dangerous: false
  },
  'dism-scanhealth': {
    exe: 'DISM.exe',
    args: ['/Online', '/Cleanup-Image', '/ScanHealth'],
    requiresAdmin: true,
    description: 'Analiza la imagen de Windows en busca de daños sin realizar cambios.',
    dangerous: false
  },
  chkdsk: {
    exe: 'chkdsk.exe',
    args: ['C:'],
    requiresAdmin: true,
    description:
      'Comprueba el disco del sistema en busca de errores. Se ejecuta en modo de solo lectura (sin /f); si se detectan errores se indicará que se necesita una comprobación completa en el próximo reinicio.',
    dangerous: false
  }
}

export const QUICK_TOOL_COMMANDS: Record<QuickToolId, CommandSpec> = {
  'cmd-admin': {
    exe: 'cmd.exe',
    args: [],
    requiresAdmin: true,
    description: 'Abre una consola de símbolo del sistema con privilegios administrativos.',
    dangerous: false
  },
  'powershell-admin': {
    exe: 'powershell.exe',
    args: [],
    requiresAdmin: true,
    description: 'Abre PowerShell con privilegios administrativos.',
    dangerous: false
  },
  terminal: {
    exe: 'wt.exe',
    args: [],
    requiresAdmin: false,
    description: 'Abre Windows Terminal.',
    dangerous: false
  },
  regedit: {
    exe: 'regedit.exe',
    args: [],
    requiresAdmin: true,
    description:
      'Abre el Editor del Registro de Windows. Los cambios incorrectos pueden dañar el sistema.',
    dangerous: false
  },
  services: {
    exe: 'services.msc',
    args: [],
    requiresAdmin: false,
    description: 'Abre el administrador de servicios de Windows.',
    dangerous: false
  },
  'device-manager': {
    exe: 'devmgmt.msc',
    args: [],
    requiresAdmin: false,
    description: 'Abre el Administrador de dispositivos.',
    dangerous: false
  },
  'disk-management': {
    exe: 'diskmgmt.msc',
    args: [],
    requiresAdmin: false,
    description: 'Abre la Administración de discos.',
    dangerous: false
  },
  'event-viewer': {
    exe: 'eventvwr.msc',
    args: [],
    requiresAdmin: false,
    description: 'Abre el Visor de eventos.',
    dangerous: false
  },
  'task-manager': {
    exe: 'taskmgr.exe',
    args: [],
    requiresAdmin: false,
    description: 'Abre el Administrador de tareas.',
    dangerous: false
  },
  'system-information': {
    exe: 'msinfo32.exe',
    args: [],
    requiresAdmin: false,
    description: 'Abre Información del sistema.',
    dangerous: false
  },
  'control-panel': {
    exe: 'control.exe',
    args: [],
    requiresAdmin: false,
    description: 'Abre el Panel de control.',
    dangerous: false
  },
  'windows-settings': {
    exe: 'cmd.exe',
    args: ['/c', 'start', '', 'ms-settings:'],
    requiresAdmin: false,
    description: 'Abre la Configuración de Windows.',
    dangerous: false
  },
  'computer-management': {
    exe: 'compmgmt.msc',
    args: [],
    requiresAdmin: false,
    description: 'Abre Administración de equipos.',
    dangerous: false
  },
  'windows-update': {
    exe: 'cmd.exe',
    args: ['/c', 'start', '', 'ms-settings:windowsupdate'],
    requiresAdmin: false,
    description: 'Abre Windows Update.',
    dangerous: false
  },
  'local-users': {
    exe: 'control.exe',
    args: ['userpasswords2'],
    requiresAdmin: false,
    description: 'Abre la administración de cuentas de usuario locales.',
    dangerous: false
  },
  firewall: {
    exe: 'control.exe',
    args: ['firewall.cpl'],
    requiresAdmin: false,
    description: 'Abre el Firewall de Windows Defender.',
    dangerous: false
  },
  'system-restore': {
    exe: 'rstrui.exe',
    args: [],
    requiresAdmin: false,
    description: 'Abre Restaurar sistema.',
    dangerous: false
  },
  'environment-variables': {
    exe: 'rundll32.exe',
    args: ['sysdm.cpl,EditEnvironmentVariables'],
    requiresAdmin: false,
    description: 'Abre el editor de variables de entorno.',
    dangerous: false
  },
  'storage-sense': {
    exe: 'cmd.exe',
    args: ['/c', 'start', '', 'ms-settings:storagesense'],
    requiresAdmin: false,
    description: 'Abre la configuración de Storage Sense.',
    dangerous: false
  }
}

export interface MaintenanceSpec {
  description: string
  dangerous: boolean
  requiresAdmin: boolean
}

export const MAINTENANCE_ACTIONS: Record<MaintenanceAction, MaintenanceSpec> = {
  'clean-temp-user': {
    description:
      'Elimina los archivos temporales del usuario actual (%TEMP%). No afecta a archivos personales.',
    dangerous: false,
    requiresAdmin: false
  },
  'clean-temp-windows': {
    description:
      'Elimina los archivos temporales de Windows (C:\\Windows\\Temp) que no estén en uso. Requiere permisos de administrador.',
    dangerous: false,
    requiresAdmin: true
  },
  'clean-explorer-cache': {
    description: 'Limpia la caché de iconos y miniaturas del Explorador de Windows.',
    dangerous: false,
    requiresAdmin: false
  },
  'restart-explorer': {
    description:
      'Reinicia el proceso explorer.exe. La barra de tareas y las ventanas del explorador parpadearán brevemente.',
    dangerous: false,
    requiresAdmin: false
  },
  'open-startup-apps': {
    description: 'Abre el administrador de aplicaciones de inicio del Administrador de tareas.',
    dangerous: false,
    requiresAdmin: false
  }
}

/**
 * Matches a winget package identifier such as Google.Chrome, 7zip.7zip or
 * Notepad++.Notepad++ (winget ids allow letters, digits, '.', '-', '_' and
 * '+', the last one needed by packages like Notepad++).
 */
export const WINGET_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.\-_+]{1,127}$/

export function isValidWingetId(id: string): boolean {
  return WINGET_ID_PATTERN.test(id)
}
