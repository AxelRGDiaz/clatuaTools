import { useEffect, useState } from 'react'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  MonitorSmartphone,
  MonitorCog,
  FileSpreadsheet,
  Network,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { ProgressBar } from '../components/ProgressBar'
import { Button } from '../components/Button'
import { useSystemStore } from '../store/systemStore'
import { useAdminStore } from '../store/adminStore'
import { formatBytes, formatPercent } from '../lib/format'
import type { WingetStatus, OfficeStatus, ActivationStatus } from '../../../shared/types'

export function Home(): React.JSX.Element {
  const { snapshot, loading, refresh } = useSystemStore()
  const { isElevated } = useAdminStore()
  const [winget, setWinget] = useState<WingetStatus | null>(null)
  const [office, setOffice] = useState<OfficeStatus | null>(null)
  const [activation, setActivation] = useState<ActivationStatus | null>(null)

  useEffect(() => {
    refresh()
    window.api.programs.checkWinget().then(setWinget)
    window.api.office.detect().then(setOffice)
    window.api.activation.check().then(setActivation)
  }, [refresh])

  const disk = snapshot?.disks?.[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-(--color-text-primary)">
            {snapshot?.computerName ?? 'Equipo'}
          </h2>
          <p className="text-sm text-(--color-text-secondary)">
            {snapshot?.currentUser ?? '—'} · {snapshot?.os.distro ?? 'Detectando sistema…'}{' '}
            {snapshot?.os.arch ? `(${snapshot.os.arch})` : ''}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={refresh}
        >
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card title="CPU" icon={<Cpu size={16} />}>
          <p className="truncate text-sm text-(--color-text-primary)">
            {snapshot?.cpu.brand ?? '—'}
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {snapshot?.cpu.physicalCores ?? '—'} núcleos · {snapshot?.cpu.speed ?? '—'} GHz
          </p>
          {snapshot?.cpu.currentLoad !== null && snapshot?.cpu.currentLoad !== undefined && (
            <div className="mt-2">
              <ProgressBar value={snapshot.cpu.currentLoad} />
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Carga: {formatPercent(snapshot.cpu.currentLoad)}
              </p>
            </div>
          )}
        </Card>

        <Card title="RAM" icon={<MemoryStick size={16} />}>
          <p className="text-sm text-(--color-text-primary)">
            {formatBytes(snapshot?.ram.totalBytes)} totales
          </p>
          <div className="mt-2">
            <ProgressBar
              value={snapshot?.ram.usedPercent ?? 0}
              tone={snapshot && snapshot.ram.usedPercent > 85 ? 'danger' : 'accent'}
            />
            <p className="mt-1 text-xs text-(--color-text-muted)">
              {formatBytes(snapshot?.ram.usedBytes)} usados (
              {formatPercent(snapshot?.ram.usedPercent)})
            </p>
          </div>
        </Card>

        <Card title="Disco" icon={<HardDrive size={16} />}>
          <p className="truncate text-sm text-(--color-text-primary)">{disk?.mount ?? '—'}</p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {formatBytes(disk?.sizeBytes)} totales
          </p>
          <p className="text-xs text-(--color-text-muted)">{formatBytes(disk?.freeBytes)} libres</p>
        </Card>

        <Card title="GPU" icon={<MonitorSmartphone size={16} />}>
          <p className="truncate text-sm text-(--color-text-primary)">
            {snapshot?.gpu?.[0]?.model ?? '—'}
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {formatBytes(snapshot?.gpu?.[0]?.vramBytes ?? null)} VRAM
          </p>
        </Card>

        <Card title="Windows" icon={<MonitorCog size={16} />}>
          <p className="truncate text-sm text-(--color-text-primary)">
            {snapshot?.os.distro ?? '—'}
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            Build {snapshot?.os.build ?? '—'}
          </p>
          <div className="mt-2">
            {activation ? (
              <Badge tone={activation.isActivated ? 'success' : 'warning'}>
                {activation.licenseStatus}
              </Badge>
            ) : (
              <Badge tone="neutral">Comprobando…</Badge>
            )}
          </div>
        </Card>

        <Card title="Office" icon={<FileSpreadsheet size={16} />}>
          {office ? (
            <>
              <p className="text-sm text-(--color-text-primary)">
                {office.installed ? office.products[0]?.name : 'No detectado'}
              </p>
              <div className="mt-2">
                <Badge tone={office.installed ? 'success' : 'neutral'}>
                  {office.installed ? 'Instalado' : 'No instalado'}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-(--color-text-muted)">Comprobando…</p>
          )}
        </Card>

        <Card title="Red" icon={<Network size={16} />}>
          <p className="text-sm text-(--color-text-primary)">{snapshot?.primaryIp ?? 'Sin IP'}</p>
          <div className="mt-2 flex items-center gap-1.5">
            {snapshot?.online ? (
              <Badge tone="success">
                <Wifi size={11} /> Conectado
              </Badge>
            ) : (
              <Badge tone="danger">
                <WifiOff size={11} /> Sin conexión
              </Badge>
            )}
          </div>
        </Card>

        <Card title="Estado del sistema">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-text-secondary)">Administrador</span>
              <Badge tone={isElevated ? 'success' : 'warning'}>{isElevated ? 'Sí' : 'No'}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-text-secondary)">winget</span>
              {winget ? (
                <Badge tone={winget.available ? 'success' : 'danger'}>
                  {winget.available ? winget.version : 'No disponible'}
                </Badge>
              ) : (
                <Badge tone="neutral">…</Badge>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
