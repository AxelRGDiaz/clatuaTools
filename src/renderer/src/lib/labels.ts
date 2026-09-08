// UI-facing labels/descriptions shown to the technician before running an
// action. These are display text only — the actual permitted commands and
// arguments live exclusively in src/main/security/commandWhitelist.ts and
// are never influenced by anything defined here.

import type { MaintenanceAction, QuickToolId, WindowsRepairAction } from '../../../shared/types'

export const REPAIR_LABELS: Record<
  WindowsRepairAction,
  { title: string; description: string; requiresAdmin: boolean }
> = {
  'sfc-scannow': {
    title: 'SFC /scannow',
    description:
      'Comprueba la integridad de todos los archivos protegidos del sistema y repara los archivos dañados cuando es posible. Puede tardar varios minutos.',
    requiresAdmin: true
  },
  'dism-restorehealth': {
    title: 'DISM /RestoreHealth',
    description:
      'Descarga e instala archivos de reparación para la imagen de Windows desde Windows Update. Requiere conexión a internet.',
    requiresAdmin: true
  },
  'dism-scanhealth': {
    title: 'DISM /ScanHealth',
    description: 'Analiza la imagen de Windows en busca de daños, sin realizar cambios.',
    requiresAdmin: true
  },
  chkdsk: {
    title: 'CHKDSK',
    description: 'Comprueba el disco del sistema (C:) en busca de errores en modo de solo lectura.',
    requiresAdmin: true
  }
}

export const QUICK_TOOL_LABELS: Record<QuickToolId, string> = {
  'cmd-admin': 'CMD (administrador)',
  'powershell-admin': 'PowerShell (administrador)',
  terminal: 'Windows Terminal',
  regedit: 'Editor del Registro',
  services: 'Servicios',
  'device-manager': 'Administrador de dispositivos',
  'disk-management': 'Administración de discos',
  'event-viewer': 'Visor de eventos',
  'task-manager': 'Administrador de tareas',
  'system-information': 'Información del sistema',
  'control-panel': 'Panel de control',
  'windows-settings': 'Configuración de Windows',
  'computer-management': 'Administración de equipos',
  'windows-update': 'Windows Update',
  'local-users': 'Usuarios locales',
  firewall: 'Firewall',
  'system-restore': 'Restaurar sistema',
  'environment-variables': 'Variables de entorno',
  'storage-sense': 'Storage Sense'
}

export const MAINTENANCE_LABELS: Record<MaintenanceAction, { title: string; description: string }> =
  {
    'clean-temp-user': {
      title: 'Limpiar temporales de usuario',
      description:
        'Elimina los archivos temporales del usuario actual (%TEMP%). No afecta a archivos personales.'
    },
    'clean-temp-windows': {
      title: 'Limpiar temporales de Windows',
      description:
        'Elimina los archivos temporales de C:\\Windows\\Temp que no estén en uso. Requiere administrador.'
    },
    'clean-explorer-cache': {
      title: 'Limpiar caché del Explorador',
      description: 'Limpia la caché de iconos y miniaturas del Explorador de Windows.'
    },
    'restart-explorer': {
      title: 'Reiniciar Windows Explorer',
      description: 'Reinicia el proceso explorer.exe. La barra de tareas parpadeará brevemente.'
    },
    'open-startup-apps': {
      title: 'Aplicaciones de inicio',
      description: 'Abre el Administrador de tareas en la pestaña de aplicaciones de inicio.'
    }
  }
