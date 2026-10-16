// Catálogo unificado de acciones reales que la Paleta de comandos y las
// Recetas pueden ejecutar. Cada acción se traduce 1:1 a un canal IPC que ya
// existe (mantenimiento, reparación, herramientas nativas, instalación), así
// que nada aquí inventa comportamiento nuevo: sólo normaliza el resultado.

import type { MaintenanceAction, QuickToolId, WindowsRepairAction } from '../../../shared/types'
import { MAINTENANCE_LABELS, QUICK_TOOL_LABELS, REPAIR_LABELS } from './labels'

export interface ActionResult {
  success: boolean
  message?: string
}

export interface AppAction {
  id: string
  title: string
  group: string
  keywords?: string
  requiresAdmin?: boolean
  // longRunning = debe ejecutarse a través del Centro de tareas.
  longRunning?: boolean
  indeterminate?: boolean
  run: () => Promise<ActionResult>
}

async function runMaintenance(action: MaintenanceAction): Promise<ActionResult> {
  const result = await window.api.maintenance.run(action)
  return { success: result.success, message: result.message }
}

async function runRepair(action: WindowsRepairAction): Promise<ActionResult> {
  const result = await window.api.windows.runRepair(action)
  return {
    success: result.success,
    message: result.success ? 'Completado' : `Error (código ${result.exitCode ?? '?'})`
  }
}

// --- Mantenimiento (acciones implementadas en maintenance.service.ts) --------
const MAINTENANCE_IDS: MaintenanceAction[] = [
  'clean-temp-user',
  'clean-temp-windows',
  'clean-explorer-cache',
  'restart-explorer',
  'open-startup-apps'
]

const LONG_MAINTENANCE = new Set<MaintenanceAction>([
  'clean-temp-user',
  'clean-temp-windows',
  'clean-explorer-cache'
])

const maintenanceActions: AppAction[] = MAINTENANCE_IDS.map((id) => ({
  id,
  title: MAINTENANCE_LABELS[id].title,
  group: 'Mantenimiento',
  keywords: MAINTENANCE_LABELS[id].description,
  requiresAdmin: id === 'clean-temp-windows',
  longRunning: LONG_MAINTENANCE.has(id),
  indeterminate: LONG_MAINTENANCE.has(id),
  run: () => runMaintenance(id)
}))

// --- Reparación de Windows (SFC / DISM / CHKDSK) -----------------------------
const REPAIR_IDS: WindowsRepairAction[] = [
  'sfc-scannow',
  'dism-scanhealth',
  'dism-restorehealth',
  'chkdsk'
]

const repairActions: AppAction[] = REPAIR_IDS.map((id) => ({
  id,
  title: REPAIR_LABELS[id].title,
  group: 'Reparar',
  keywords: REPAIR_LABELS[id].description,
  requiresAdmin: REPAIR_LABELS[id].requiresAdmin,
  longRunning: true,
  indeterminate: true,
  run: () => runRepair(id)
}))

// --- Herramientas nativas de Windows -----------------------------------------
const quickToolActions: AppAction[] = (Object.keys(QUICK_TOOL_LABELS) as QuickToolId[]).map(
  (tool) => ({
    id: `tool:${tool}`,
    title: QUICK_TOOL_LABELS[tool],
    group: 'Herramientas de Windows',
    run: async () => {
      await window.api.windows.openTool(tool)
      return { success: true }
    }
  })
)

// --- Instalar programas recomendados (los marcados como quickInstall) --------
const installRecommended: AppAction = {
  id: 'install-recommended',
  title: 'Instalar programas recomendados',
  group: 'Programas',
  keywords: 'winget instalar esenciales equipo nuevo',
  longRunning: true,
  indeterminate: true,
  run: async () => {
    const list = await window.api.programs.list()
    const ids = list.filter((a) => a.quickInstall).map((a) => a.id)
    if (ids.length === 0) {
      return { success: true, message: 'No hay programas recomendados en el catálogo.' }
    }
    const results = await window.api.programs.installBatch(ids)
    const failed = results.filter((r) => !r.success)
    return {
      success: failed.length === 0,
      message:
        failed.length === 0
          ? `${results.length} programas instalados o ya presentes.`
          : `${failed.length} de ${results.length} fallaron.`
    }
  }
}

export const OS_ACTIONS: AppAction[] = [
  ...maintenanceActions,
  ...repairActions,
  installRecommended,
  ...quickToolActions
]

export function findAction(id: string): AppAction | undefined {
  return OS_ACTIONS.find((a) => a.id === id)
}
