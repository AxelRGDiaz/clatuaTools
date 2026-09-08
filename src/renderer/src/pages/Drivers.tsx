import { useEffect, useState } from 'react'
import { Cpu, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import type { DriverProblem, VendorLink } from '../../../shared/types'

export function Drivers(): React.JSX.Element {
  const [problems, setProblems] = useState<DriverProblem[] | null>(null)
  const [links, setLinks] = useState<VendorLink[]>([])

  useEffect(() => {
    window.api.drivers.listProblems().then(setProblems)
    window.api.drivers.getVendorLinks().then(setLinks)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Dispositivos con problemas"
        icon={<Cpu size={16} />}
        action={
          <Button variant="secondary" onClick={() => window.api.drivers.openDeviceManager()}>
            Administrador de dispositivos
          </Button>
        }
      >
        {problems === null ? (
          <p className="text-sm text-(--color-text-muted)">Analizando dispositivos…</p>
        ) : problems.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-(--color-success)">
            <CheckCircle2 size={16} /> No se detectaron problemas de drivers.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {problems.map((p) => (
              <div
                key={p.deviceId}
                className="flex items-start gap-2 rounded-lg border border-(--color-warning)/30 bg-(--color-warning)/10 p-3"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-(--color-warning)" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-(--color-text-primary)">
                    {p.deviceName}
                  </p>
                  <p className="text-xs text-(--color-text-secondary)">
                    {p.manufacturer ?? 'Fabricante desconocido'} · Código de error{' '}
                    {p.errorCode ?? '?'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Descargar drivers oficiales">
        <p className="mb-3 text-xs text-(--color-text-secondary)">
          Enlaces oficiales de fabricantes. Nunca descargues drivers de sitios de terceros no
          verificados.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {links.map((link) => (
            <Button
              key={link.vendor}
              variant="secondary"
              icon={<ExternalLink size={13} />}
              onClick={() => window.open(link.url, '_blank')}
            >
              {link.vendor}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
