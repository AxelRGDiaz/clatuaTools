import { useEffect, useState } from 'react'
import { FileSpreadsheet, ExternalLink, Download } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import type { OfficeInstallChoice, OfficeStatus } from '../../../shared/types'

export function Office(): React.JSX.Element {
  const [status, setStatus] = useState<OfficeStatus | null>(null)
  const [installing, setInstalling] = useState<OfficeInstallChoice | null>(null)

  const load = (): void => {
    window.api.office.detect().then(setStatus)
  }

  useEffect(load, [])

  const handleInstall = async (choice: OfficeInstallChoice): Promise<void> => {
    setInstalling(choice)
    await window.api.office.install(choice)
    setInstalling(null)
    load()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Estado de Microsoft Office" icon={<FileSpreadsheet size={16} />}>
        {status ? (
          status.installed ? (
            <div className="flex flex-col gap-2">
              {status.products.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-(--color-text-primary)">{p.name}</p>
                    <p className="text-xs text-(--color-text-secondary)">Versión {p.version}</p>
                  </div>
                  <Badge tone="info">{p.architecture}</Badge>
                </div>
              ))}
              {status.licenseStatus && (
                <div className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3">
                  <p className="mb-1 text-xs font-medium text-(--color-text-secondary)">
                    Estado de licencia (ospp.vbs)
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] text-(--color-text-muted)">
                    {status.licenseStatus}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-(--color-text-secondary)">
              No se detectó ninguna instalación de Microsoft Office.
            </p>
          )
        ) : (
          <p className="text-sm text-(--color-text-muted)">Detectando…</p>
        )}

        <div className="mt-3">
          <Button
            variant="ghost"
            icon={<ExternalLink size={14} />}
            onClick={() => window.api.office.openActivation()}
          >
            Abrir cuenta y activación de Microsoft 365
          </Button>
        </div>
      </Card>

      <Card title="Instalar Microsoft 365 / Office">
        <p className="mb-3 text-xs text-(--color-text-secondary)">
          La instalación utiliza el instalador oficial de Microsoft (a través de winget). La
          activación se realiza iniciando sesión con una cuenta de Microsoft 365 o una licencia por
          volumen válida dentro de Office — esta aplicación no incluye ni implementa ningún
          mecanismo de activación no autorizado.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            icon={<Download size={14} />}
            loading={installing === 'microsoft365'}
            disabled={installing !== null}
            onClick={() => handleInstall('microsoft365')}
          >
            Instalar Microsoft 365
          </Button>
          <Button
            variant="secondary"
            icon={<Download size={14} />}
            loading={installing === 'office-ltsc'}
            disabled={installing !== null}
            onClick={() => handleInstall('office-ltsc')}
          >
            Instalar Office LTSC
          </Button>
        </div>
        <p className="mt-3 text-xs text-(--color-text-muted)">
          Office LTSC requiere una licencia por volumen válida asociada a tu organización.
        </p>
      </Card>
    </div>
  )
}
