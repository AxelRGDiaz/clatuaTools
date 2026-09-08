import { useEffect } from 'react'
import { SettingsIcon } from 'lucide-react'
import { Card } from '../components/Card'
import { useSettingsStore } from '../store/settingsStore'

function Toggle({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-(--color-surface-border) py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-(--color-text-primary)">{label}</p>
        <p className="text-xs text-(--color-text-secondary)">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? 'bg-(--color-accent)' : 'bg-(--color-surface-3)'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

export function Settings(): React.JSX.Element {
  const { settings, load, update } = useSettingsStore()

  useEffect(() => {
    load()
  }, [load])

  if (!settings) return <p className="text-sm text-(--color-text-muted)">Cargando configuración…</p>

  return (
    <div className="flex flex-col gap-4">
      <Card title="General" icon={<SettingsIcon size={16} />}>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">
            Nombre de la aplicación
          </label>
          <input
            value={settings.appName}
            onChange={(e) => update({ appName: e.target.value })}
            className="w-full max-w-sm rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">
            Tema
          </label>
          <select
            value={settings.theme}
            onChange={(e) => update({ theme: e.target.value as 'dark' | 'light' })}
            className="w-full max-w-sm rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
          >
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
          </select>
        </div>

        <Toggle
          checked={settings.technicalMode}
          onChange={(v) => update({ technicalMode: v })}
          label="Modo técnico"
          description="Muestra comandos ejecutados, códigos de salida y detalles técnicos de errores."
        />
        <Toggle
          checked={settings.autoStart}
          onChange={(v) => update({ autoStart: v })}
          label="Inicio automático"
          description="Inicia ClatuaTech Tools automáticamente al arrancar Windows."
        />
      </Card>

      <Card title="Comportamiento de UAC">
        <select
          value={settings.uacBehavior}
          onChange={(e) =>
            update({ uacBehavior: e.target.value as 'always-ask' | 'silent-when-possible' })
          }
          className="w-full max-w-sm rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
        >
          <option value="always-ask">Pedir siempre confirmación</option>
          <option value="silent-when-possible">Minimizar solicitudes cuando sea posible</option>
        </select>
        <p className="mt-2 text-xs text-(--color-text-secondary)">
          Las acciones potencialmente peligrosas siempre pedirán confirmación explícita,
          independientemente de esta opción.
        </p>
      </Card>

      <Card title="Registro">
        <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">
          Retención de logs (días)
        </label>
        <input
          type="number"
          min={1}
          value={settings.logRetentionDays}
          onChange={(e) => update({ logRetentionDays: Number(e.target.value) })}
          className="w-32 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
        />
      </Card>

      <Card title="Catálogo de programas y enlaces de drivers">
        <p className="text-xs text-(--color-text-secondary)">
          La lista de programas instalables (con sus identificadores de winget) vive en{' '}
          <code className="rounded bg-(--color-surface-3) px-1 py-0.5 font-mono">
            src/main/config/apps.json
          </code>
          . Los enlaces oficiales de drivers por fabricante viven en{' '}
          <code className="rounded bg-(--color-surface-3) px-1 py-0.5 font-mono">
            src/main/config/driverLinks.json
          </code>
          . Edita esos archivos (o sustitúyelos por una fuente remota versionada) para actualizar el
          catálogo sin tocar el código de la interfaz.
        </p>
      </Card>
    </div>
  )
}
