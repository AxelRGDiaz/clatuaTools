import { useEffect } from 'react'
import { ShieldAlert, ShieldCheck, Terminal } from 'lucide-react'
import { useNavStore, type PageId } from '../store/navStore'
import { useAdminStore } from '../store/adminStore'
import { useSettingsStore } from '../store/settingsStore'
import { Button } from './Button'

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
          className="flex items-center gap-1.5 rounded-full border border-(--color-surface-border) px-3 py-1 text-xs text-(--color-text-secondary) hover:bg-(--color-surface-2) cursor-pointer"
          title="Alternar modo técnico"
        >
          <Terminal size={13} />
          Modo técnico {settings?.technicalMode ? 'activado' : 'desactivado'}
        </button>

        <button
          onClick={toggleLogPanel}
          className="rounded-full border border-(--color-surface-border) px-3 py-1 text-xs text-(--color-text-secondary) hover:bg-(--color-surface-2) cursor-pointer"
        >
          Registro
        </button>

        {checked && (
          <>
            {isElevated ? (
              <span className="flex items-center gap-1.5 rounded-full border border-(--color-success)/30 bg-(--color-success)/10 px-3 py-1 text-xs font-medium text-(--color-success)">
                <ShieldCheck size={13} />
                Administrador
              </span>
            ) : (
              <Button
                variant="secondary"
                className="!py-1 !px-3 text-xs"
                icon={<ShieldAlert size={13} />}
                onClick={relaunchAsAdmin}
              >
                Reiniciar como administrador
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  )
}
