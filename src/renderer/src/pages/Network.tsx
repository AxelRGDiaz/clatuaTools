import { useEffect, useState } from 'react'
import { Network as NetworkIcon, Play } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { useSystemStore } from '../store/systemStore'
import type { CommandExecutionResult } from '../../../shared/types'

export function Network(): React.JSX.Element {
  const { snapshot, refresh } = useSystemStore()
  const [host, setHost] = useState('8.8.8.8')
  const [pingResult, setPingResult] = useState<CommandExecutionResult | null>(null)
  const [dnsResult, setDnsResult] = useState<CommandExecutionResult | null>(null)
  const [busy, setBusy] = useState<'ping' | 'dns' | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  const runPing = async (): Promise<void> => {
    setBusy('ping')
    setPingResult(await window.api.system.ping(host))
    setBusy(null)
  }

  const runDns = async (): Promise<void> => {
    setBusy('dns')
    setDnsResult(await window.api.system.dnsLookup(host))
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Adaptadores de red" icon={<NetworkIcon size={16} />}>
        {snapshot?.network?.length ? (
          <div className="flex flex-col gap-2">
            {snapshot.network.map((n) => (
              <div
                key={n.iface}
                className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-(--color-text-primary)">{n.iface}</p>
                  <Badge tone={n.isUp ? 'success' : 'neutral'}>
                    {n.isUp ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-(--color-text-secondary)">
                  <span>IPv4: {n.ip4 || '—'}</span>
                  <span>IPv6: {n.ip6 || '—'}</span>
                  <span>MAC: {n.mac || '—'}</span>
                  <span>Gateway: {n.gateway ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-(--color-text-muted)">Sin adaptadores detectados.</p>
        )}
      </Card>

      <Card title="Pruebas de conexión">
        <div className="mb-3 flex gap-2">
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Host o IP (ej. 8.8.8.8)"
            className="flex-1 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
          />
          <Button
            variant="secondary"
            icon={<Play size={13} />}
            loading={busy === 'ping'}
            onClick={runPing}
          >
            Ping
          </Button>
          <Button
            variant="secondary"
            icon={<Play size={13} />}
            loading={busy === 'dns'}
            onClick={runDns}
          >
            DNS lookup
          </Button>
        </div>

        {pingResult && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-(--color-text-secondary)">
              Resultado de ping
            </p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-(--color-surface-2) p-3 font-mono text-[11px] text-(--color-text-muted)">
              {pingResult.stdout || pingResult.stderr || 'Sin salida.'}
            </pre>
          </div>
        )}
        {dnsResult && (
          <div>
            <p className="mb-1 text-xs font-medium text-(--color-text-secondary)">
              Resultado de DNS lookup
            </p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-(--color-surface-2) p-3 font-mono text-[11px] text-(--color-text-muted)">
              {dnsResult.stdout || dnsResult.stderr || 'Sin salida.'}
            </pre>
          </div>
        )}
      </Card>
    </div>
  )
}
