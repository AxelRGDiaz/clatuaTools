// Recetas: flujos guiados que encadenan acciones del catálogo (actions.ts).
// Cada paso referencia una acción real por su id; el ejecutor las corre en
// orden a través del Centro de tareas. Son recetas integradas de fábrica;
// guardar recetas propias del técnico queda pendiente (necesita persistir en
// el servicio de configuración).

export interface Recipe {
  id: string
  name: string
  description: string
  // ids de acciones definidas en OS_ACTIONS.
  stepActionIds: string[]
  // Si un paso falla, detener los siguientes (por defecto: continuar).
  stopOnError?: boolean
}

export const RECIPES: Recipe[] = [
  {
    id: 'mantenimiento-rapido',
    name: 'Mantenimiento rápido',
    description: 'Limpia temporales de usuario y de Windows y la caché del Explorador.',
    stepActionIds: ['clean-temp-user', 'clean-temp-windows', 'clean-explorer-cache']
  },
  {
    id: 'reparar-sistema',
    name: 'Reparar archivos del sistema',
    description: 'Analiza y repara la imagen de Windows y luego verifica los archivos protegidos.',
    stepActionIds: ['dism-scanhealth', 'dism-restorehealth', 'sfc-scannow'],
    stopOnError: true
  },
  {
    id: 'liberar-refrescar',
    name: 'Liberar y refrescar',
    description: 'Limpia temporales y caché del Explorador y reinicia el Explorador de Windows.',
    stepActionIds: ['clean-temp-user', 'clean-explorer-cache', 'restart-explorer']
  },
  {
    id: 'equipo-nuevo',
    name: 'Equipo nuevo · esenciales',
    description: 'Instala de una vez los programas recomendados del catálogo.',
    stepActionIds: ['install-recommended']
  }
]
