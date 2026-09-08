import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, PlayCircle } from 'lucide-react'
import { Card } from '../components/Card'
import { Checkbox } from '../components/Checkbox'
import { Button } from '../components/Button'
import type { AppEntry, InstallResult } from '../../../shared/types'

type RowStatus = 'pending' | 'installing' | 'success' | 'error'

export function QuickInstall(): React.JSX.Element {
  const [apps, setApps] = useState<AppEntry[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [running, setRunning] = useState(false)
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({})
  const [rowMessage, setRowMessage] = useState<Record<string, string>>({})

  useEffect(() => {
    window.api.programs.list().then((list) => {
      const quick = list.filter((a) => a.quickInstall)
      setApps(quick)
      setSelected(new Set(quick.map((a) => a.id)))
    })
    return window.api.programs.onInstallProgress((result: InstallResult) => {
      setRowStatus((s) => ({ ...s, [result.appId]: result.success ? 'success' : 'error' }))
      setRowMessage((m) => ({ ...m, [result.appId]: result.message }))
    })
  }, [])

  const toggle = (id: string, checked: boolean): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleInstall = async (): Promise<void> => {
    const ids = [...selected]
    if (ids.length === 0) return
    setRunning(true)
    const initial: Record<string, RowStatus> = {}
    ids.forEach((id) => (initial[id] = 'installing'))
    setRowStatus(initial)
    setRowMessage({})

    // installBatch runs installs sequentially in the main process and emits
    // a programsInstallProgress event per app as each one finishes.
    await window.api.programs.installBatch(ids)
    setRunning(false)
  }

  const summary = apps.filter((a) => selected.has(a.id) && rowStatus[a.id] === 'success').length
  const failures = apps.filter((a) => selected.has(a.id) && rowStatus[a.id] === 'error').length
  const finished = !running && Object.keys(rowStatus).length > 0

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Selecciona los programas a instalar"
        action={
          <Button
            variant="primary"
            icon={<PlayCircle size={15} />}
            loading={running}
            onClick={handleInstall}
            disabled={selected.size === 0}
          >
            Instalar seleccionados ({selected.size})
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <div key={app.id} className="relative">
              <Checkbox
                checked={selected.has(app.id)}
                onChange={(checked) => toggle(app.id, checked)}
                label={app.name}
                description={app.description}
                disabled={running}
              />
              {rowStatus[app.id] && (
                <span className="absolute right-3 top-3">
                  {rowStatus[app.id] === 'success' && (
                    <CheckCircle2 size={16} className="text-(--color-success)" />
                  )}
                  {rowStatus[app.id] === 'error' && (
                    <XCircle size={16} className="text-(--color-danger)" />
                  )}
                  {rowStatus[app.id] === 'installing' && (
                    <Loader2 size={16} className="animate-spin text-(--color-accent)" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {finished && (
        <Card title="Resumen">
          <div className="mb-3 flex gap-4 text-sm">
            <span className="text-(--color-success)">✓ {summary} instalados correctamente</span>
            {failures > 0 && (
              <span className="text-(--color-danger)">✗ {failures} con errores</span>
            )}
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            {apps
              .filter((a) => selected.has(a.id))
              .map((app) => (
                <li key={app.id} className="flex items-center gap-2">
                  {rowStatus[app.id] === 'success' ? (
                    <CheckCircle2 size={14} className="text-(--color-success)" />
                  ) : (
                    <XCircle size={14} className="text-(--color-danger)" />
                  )}
                  <span className="text-(--color-text-primary)">{app.name}</span>
                  {rowMessage[app.id] && (
                    <span className="text-xs text-(--color-text-muted)">
                      — {rowMessage[app.id]}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
