import { useEffect } from 'react'
import { ShieldAlert, ShieldCheck, Terminal, ScrollText } from 'lucide-react'
import { useNavStore, type PageId } from '../store/navStore'
import { useAdminStore } from '../store/adminStore'
import { useSettingsStore } from '../store/settingsStore'
import { cn } from '../lib/cn'

// Every chip in the header row shares this exact shape/size — only the
// color tokens change with state. Mixing a pill shape for some states and
// a different shape (e.g. the generic Button's rounded-lg) for others is
// what made the row look uneven depending on whether something was on/off.
const PILL =
  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer'
const PILL_ON = 'border-(--color-accent)/40 bg-(--color-accent-soft) text-(--color-accent)'
const PILL_OFF =
  'border-(--color-surface-border) bg-transparent text-(--color-text-secondary) hover:bg-(--color-surface-2)'
const PILL_SUCCESS = 'border-(--color-success)/30 bg-(--color-success)/10 text-(--color-success)'
const PILL_WARNING =
  'border-(--color-warning)/30 bg-(--color-warning)/10 text-(--color-warning) hover:bg-(--color-warning)/20'

const PAGE_TITLES: Record<PageId, string> = {
  home: 'Inicio',
  programs: 'Programas',
  'quick-install': 'Instalación rápida',
  windows: 'Windows',
  office: 'Office',
  activation: 'Licencia y activación',
  drivers: 'Drivers',
  diagnostics: 'Diagnóstico',
  maintenance: 'Mantenimiento',
  network: 'Red',
  tools: 'Herramientas',
  settings: 'Configuración'
}

export function TopBar(): React.JSX.Element {
  const activePage = useNavStore((s) => s.activePage)
  const logPanelOpen = useNavStore((s) => s.logPanelOpen)
  const toggleLogPanel = useNavStore((s) => s.toggleLogPanel)
  const { isElevated, checked, refresh, relaunchAsAdmin } = useAdminStore()
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.update)

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-(--color-surface-border) bg-(--color-surface-1) px-5">
      <h1 className="text-sm font-semibold text-(--color-text-primary)">
        {PAGE_TITLES[activePage]}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateSettings({ technicalMode: !settings?.technicalMode })}
          className={cn(PILL, settings?.technicalMode ? PILL_ON : PILL_OFF)}
          title="Alternar modo técnico"
        >
          <Terminal size={13} />
          Modo técnico {settings?.technicalMode ? 'activado' : 'desactivado'}
        </button>

        <button
          onClick={toggleLogPanel}
          className={cn(PILL, logPanelOpen ? PILL_ON : PILL_OFF)}
          title="Mostrar u ocultar el panel de registro"
        >
          <ScrollText size={13} />
          Registro
        </button>

        {checked && (
          <>
            {isElevated ? (
              <span className={cn(PILL, PILL_SUCCESS, 'cursor-default')}>
                <ShieldCheck size={13} />
                Administrador
              </span>
            ) : (
              <button onClick={relaunchAsAdmin} className={cn(PILL, PILL_WARNING)}>
                <ShieldAlert size={13} />
                Reiniciar como administrador
              </button>
            )}
          </>
        )}
      </div>
    </header>
  )
}
