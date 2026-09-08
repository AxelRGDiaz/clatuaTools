import { useEffect } from 'react'
import { Cpu, MemoryStick, HardDrive, MonitorSmartphone, Server, RefreshCw } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useSystemStore } from '../store/systemStore'
import { formatBytes, formatPercent } from '../lib/format'

function Row({ label, value }: { label: string; value: string | number }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-(--color-surface-border) py-1.5 last:border-0">
      <span className="text-xs text-(--color-text-secondary)">{label}</span>
      <span className="text-xs font-medium text-(--color-text-primary)">{value}</span>
    </div>
  )
}

export function Diagnostics(): React.JSX.Element {
  const { snapshot, loading, refresh } = useSystemStore()

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="secondary"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={refresh}
        >
          Volver a analizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="CPU" icon={<Cpu size={16} />}>
          <Row label="Fabricante" value={snapshot?.cpu.manufacturer ?? '—'} />
          <Row label="Modelo" value={snapshot?.cpu.brand ?? '—'} />
          <Row label="Núcleos físicos" value={snapshot?.cpu.physicalCores ?? '—'} />
          <Row label="Hilos" value={snapshot?.cpu.cores ?? '—'} />
          <Row label="Frecuencia" value={snapshot ? `${snapshot.cpu.speed} GHz` : '—'} />
          <Row label="Carga actual" value={formatPercent(snapshot?.cpu.currentLoad)} />
        </Card>

        <Card title="RAM" icon={<MemoryStick size={16} />}>
          <Row label="Total" value={formatBytes(snapshot?.ram.totalBytes)} />
          <Row label="Disponible" value={formatBytes(snapshot?.ram.freeBytes)} />
          <Row label="En uso" value={formatBytes(snapshot?.ram.usedBytes)} />
          <Row label="Porcentaje usado" value={formatPercent(snapshot?.ram.usedPercent)} />
        </Card>

        <Card title="GPU" icon={<MonitorSmartphone size={16} />}>
          {snapshot?.gpu?.length ? (
            snapshot.gpu.map((g, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <Row label="Modelo" value={g.model} />
                <Row label="Fabricante" value={g.vendor} />
                <Row label="VRAM" value={formatBytes(g.vramBytes)} />
              </div>
            ))
          ) : (
            <p className="text-xs text-(--color-text-muted)">No detectada.</p>
          )}
        </Card>

        <Card title="Disco" icon={<HardDrive size={16} />}>
          {snapshot?.disks?.map((d) => (
            <div key={d.mount} className="mb-2 last:mb-0">
              <Row label="Punto de montaje" value={d.mount} />
              <Row label="Modelo" value={d.model} />
              <Row label="Tipo" value={d.type} />
              <Row label="Capacidad" value={formatBytes(d.sizeBytes)} />
              <Row label="Espacio libre" value={formatBytes(d.freeBytes)} />
            </div>
          ))}
        </Card>

        <Card title="Sistema" icon={<Server size={16} />}>
          <Row label="Windows" value={snapshot?.os.distro ?? '—'} />
          <Row label="Versión" value={snapshot?.os.release ?? '—'} />
          <Row label="Build" value={snapshot?.os.build ?? '—'} />
          <Row label="Arquitectura" value={snapshot?.os.arch ?? '—'} />
          <Row
            label="UEFI"
            value={
              snapshot?.os.uefi === null
                ? 'Desconocido'
                : snapshot?.os.uefi
                  ? 'Sí'
                  : 'No (BIOS Legacy)'
            }
          />
          <Row
            label="Placa base"
            value={snapshot ? `${snapshot.board.manufacturer} ${snapshot.board.model}` : '—'}
          />
          <Row
            label="BIOS"
            value={snapshot ? `${snapshot.board.biosVendor} ${snapshot.board.biosVersion}` : '—'}
          />
        </Card>
      </div>
    </div>
  )
}
