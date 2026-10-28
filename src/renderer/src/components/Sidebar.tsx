import {
  Home,
  Package,
  Zap,
  MonitorCog,
  FileSpreadsheet,
  ShieldCheck,
  Cpu,
  Activity,
  Wrench,
  Network,
  Hammer,
  Settings,
  ToolCase,
  ListChecks,
  FileText,
  Search,
  type LucideIcon
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useNavStore, type PageId } from '../store/navStore'
import logo from '../assets/logo.png'

interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

interface NavGroup {
  // Sin label = bloque superior sin encabezado (Inicio).
  label?: string
  items: NavItem[]
}

// Navegación agrupada por intención, siguiendo el rediseño 2.0:
// Preparar / Diagnosticar / Reparar / Sistema. Cada entrada apunta a una
// página que ya existe en la app; no se inventan pantallas nuevas.
const NAV_GROUPS: NavGroup[] = [
  { items: [{ id: 'home', label: 'Inicio', icon: Home }] },
  {
    label: 'Preparar',
    items: [
      { id: 'recipes', label: 'Recetas', icon: ListChecks },
      { id: 'programs', label: 'Programas', icon: Package },
      { id: 'quick-install', label: 'Instalación rápida', icon: Zap },
      { id: 'office', label: 'Office', icon: FileSpreadsheet }
    ]
  },
  {
    label: 'Diagnosticar',
    items: [
      { id: 'diagnostics', label: 'Diagnóstico', icon: Activity },
      { id: 'network', label: 'Red', icon: Network },
      { id: 'drivers', label: 'Drivers', icon: Cpu },
      { id: 'activation', label: 'Licencia y activación', icon: ShieldCheck }
    ]
  },
  {
    label: 'Reparar',
    items: [
      { id: 'windows', label: 'Windows', icon: MonitorCog },
      { id: 'maintenance', label: 'Mantenimiento', icon: Wrench }
    ]
  },
  {
    label: 'Sistema',
    items: [
      { id: 'tools', label: 'Herramientas', icon: Hammer },
      { id: 'report', label: 'Informe e historial', icon: FileText },
      { id: 'settings', label: 'Configuración', icon: Settings }
    ]
  }
]

// Look compartido por cada entrada del riel, para que el botón extra se vea
// idéntico a los ítems de página que lo rodean.
const NAV_BUTTON =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer'
const NAV_BUTTON_ACTIVE = 'bg-(--color-accent-soft) text-(--color-accent-text) font-medium'
const NAV_BUTTON_IDLE =
  'text-(--color-text-secondary) hover:bg-(--color-surface-2) hover:text-(--color-text-primary)'

// Ejecuta la herramienta rápida "system-activation" a través del puente IPC
// (window.api.windows.openTool). El main process la resuelve contra
// QUICK_TOOL_COMMANDS en commandWhitelist.ts, igual que las demás
// herramientas de la página Herramientas.
function handleSystemToolsClick(): void {
  window.api.windows
    .openTool('system-activation')
    .then(() => console.log('Comando de herramientas de sistema enviado con éxito.'))
    .catch((err) => console.error('Error al ejecutar la herramienta rápida:', err))
}

export function Sidebar(): React.JSX.Element {
  const activePage = useNavStore((s) => s.activePage)
  const setActivePage = useNavStore((s) => s.setActivePage)
  const togglePalette = useNavStore((s) => s.togglePalette)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-(--color-surface-border) bg-(--color-surface-1)">
      <div className="flex items-center gap-2.5 border-b border-(--color-surface-border) px-4 py-4">
        <img src={logo} alt="ClatuaTech Tools" className="h-8 w-8 rounded-lg" />
        <div>
          <p className="text-sm font-semibold leading-none text-(--color-text-primary)">
            ClatuaTech
          </p>
          <p className="mt-0.5 text-xs leading-none text-(--color-text-muted)">Tools 2.0</p>
        </div>
      </div>

      <div className="px-2 pt-3">
        <button
          type="button"
          onClick={togglePalette}
          className="flex w-full items-center gap-2 rounded-lg border border-(--color-surface-border) bg-(--color-surface-0) px-3 py-2 text-left text-xs text-(--color-text-muted) transition-colors hover:border-(--color-accent)/50 cursor-pointer"
          title="Buscar o ejecutar (Ctrl K)"
        >
          <Search size={14} />
          <span className="flex-1">Buscar o ejecutar…</span>
          <span className="rounded border border-(--color-surface-border) px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl K
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`}>
            {group.label && (
              <p className="px-3 pt-3 pb-1.5 text-[10.5px] font-semibold tracking-wider text-(--color-text-muted) uppercase">
                {group.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = activePage === item.id
                return (
                  <li key={item.id} className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setActivePage(item.id)}
                      className={cn(NAV_BUTTON, active ? NAV_BUTTON_ACTIVE : NAV_BUTTON_IDLE)}
                    >
                      <Icon size={16} strokeWidth={2} />
                      {item.label}
                    </button>

                    {item.id === 'tools' && (
                      <button
                        type="button"
                        onClick={handleSystemToolsClick}
                        className={cn(NAV_BUTTON, NAV_BUTTON_IDLE)}
                        title="Herramientas de Sistema"
                      >
                        <ToolCase size={16} strokeWidth={2} />
                        Herramientas de Sistema
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-(--color-surface-border) px-4 py-3 text-xs text-(--color-text-muted)">
        ClatuaTech Tools v{__APP_VERSION__}
      </div>
    </aside>
  )
}
