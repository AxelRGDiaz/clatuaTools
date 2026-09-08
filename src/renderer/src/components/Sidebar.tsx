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

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'programs', label: 'Programas', icon: Package },
  { id: 'quick-install', label: 'Instalación rápida', icon: Zap },
  { id: 'windows', label: 'Windows', icon: MonitorCog },
  { id: 'office', label: 'Office', icon: FileSpreadsheet },
  { id: 'activation', label: 'Licencia y activación', icon: ShieldCheck },
  { id: 'drivers', label: 'Drivers', icon: Cpu },
  { id: 'diagnostics', label: 'Diagnóstico', icon: Activity },
  { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { id: 'network', label: 'Red', icon: Network },
  { id: 'tools', label: 'Herramientas', icon: Hammer },
  { id: 'settings', label: 'Configuración', icon: Settings }
]

export function Sidebar(): React.JSX.Element {
  const activePage = useNavStore((s) => s.activePage)
  const setActivePage = useNavStore((s) => s.setActivePage)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-(--color-surface-border) bg-(--color-surface-1)">
      <div className="flex items-center gap-2 border-b border-(--color-surface-border) px-4 py-4">
        <img src={logo} alt="ClatuaTech Tools" className="h-8 w-8 rounded-lg" />
        <div>
          <p className="text-sm font-semibold leading-none text-(--color-text-primary)">
            ClatuaTech
          </p>
          <p className="text-xs leading-none text-(--color-text-secondary)">Tools</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activePage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                    active
                      ? 'bg-(--color-accent-soft) text-(--color-accent) font-medium'
                      : 'text-(--color-text-secondary) hover:bg-(--color-surface-2) hover:text-(--color-text-primary)'
                  )}
                >
                  <Icon size={16} strokeWidth={2} />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-(--color-surface-border) px-4 py-3 text-xs text-(--color-text-muted)">
        ClatuaTech Tools v1.0.0
      </div>
    </aside>
  )
}
