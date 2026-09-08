import { useEffect, useState } from 'react'
import { ShieldCheck, ExternalLink, Stethoscope, RefreshCw } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import type { ActivationStatus } from '../../../shared/types'

export function Activation(): React.JSX.Element {
  const [status, setStatus] = useState<ActivationStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.activation.check()
    setStatus(result)
    setLoading(false)
  }

  useEffect(() => {
    window.api.activation.check().then(setStatus)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Licencia y activación de Windows"
        icon={<ShieldCheck size={16} />}
        action={
          <Button
            variant="ghost"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={load}
          >
            Comprobar activación
          </Button>
        }
      >
        {status ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3">
              <p className="text-xs text-(--color-text-secondary)">Edición</p>
              <p className="text-sm font-medium text-(--color-text-primary)">
                {status.edition ?? 'Desconocida'}
              </p>
            </div>
            <div className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3">
              <p className="text-xs text-(--color-text-secondary)">Estado</p>
              <Badge tone={status.isActivated ? 'success' : 'warning'}>
                {status.licenseStatus}
              </Badge>
            </div>
            <div className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3">
              <p className="text-xs text-(--color-text-secondary)">Canal de licencia</p>
              <p className="text-sm text-(--color-text-primary)">{status.licenseChannel ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3">
              <p className="text-xs text-(--color-text-secondary)">Clave parcial</p>
              <p className="font-mono text-sm text-(--color-text-primary)">
                {status.partialProductKey ?? '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-(--color-text-muted)">Comprobando…</p>
        )}

        {status && !status.isActivated && (
          <p className="mt-3 rounded-lg border border-(--color-warning)/30 bg-(--color-warning)/10 px-3 py-2 text-xs text-(--color-warning)">
            Windows no está activado. Introduce una clave de producto válida o inicia sesión con la
            cuenta que tiene una licencia digital asociada a este equipo.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<ExternalLink size={14} />}
            onClick={() => window.api.activation.openSettings()}
          >
            Abrir configuración de activación
          </Button>
          <Button
            variant="ghost"
            icon={<Stethoscope size={14} />}
            onClick={() => window.api.activation.runDiagnostic()}
          >
            Ejecutar diagnóstico
          </Button>
        </div>
      </Card>
    </div>
  )
}
