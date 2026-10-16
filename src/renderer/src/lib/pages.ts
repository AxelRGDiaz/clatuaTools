import type { PageId } from '../store/navStore'

// Título visible de cada página. Fuente única usada por la barra superior y la
// paleta de comandos para no duplicar las etiquetas.
export const PAGE_TITLES: Record<PageId, string> = {
  home: 'Inicio',
  recipes: 'Recetas',
  programs: 'Programas',
  'quick-install': 'Instalación rápida',
  windows: 'Windows',
  office: 'Office',
  drivers: 'Drivers',
  diagnostics: 'Diagnóstico',
  maintenance: 'Mantenimiento',
  network: 'Red',
  tools: 'Herramientas',
  activation: 'Licencia y activación',
  report: 'Informe e historial',
  settings: 'Configuración'
}
