import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MAINTENANCE_LABELS } from '../lib/labels'
import type { MaintenanceAction, MaintenanceActionResult } from '../../../shared/types'
import { formatBytes } from '../lib/format'

const ACTIONS: MaintenanceAction[] = [
  'clean-temp-user',
  'clean-temp-windows',
  'clean-explorer-cache',
  'restart-explorer',
  'open-startup-apps'
]

export function Maintenance(): React.JSX.Element {
  const [pending, setPending] = useState<MaintenanceAction | null>(null)
  const [running, setRunning] = useState<MaintenanceAction | null>(null)
  const [results, setResults] = useState<Record<string, MaintenanceActionResult>>({})

  const run = async (action: MaintenanceAction): Promise<void> => {
    setPending(null)
    setRunning(action)
    const result = await window.api.maintenance.run(action)
    setResults((r) => ({ ...r, [action]: result }))
    setRunning(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Optimización y mantenimiento" icon={<Sparkles size={16} />}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACTIONS.map((action) => {
            const result = results[action]
            return (
              <div
                key={action}
                className="flex items-center justify-between gap-3 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-(--color-text-primary)">
                    {MAINTENANCE_LABELS[action].title}
                  </p>
                  <p className="text-xs text-(--color-text-secondary)">
                    {MAINTENANCE_LABELS[action].description}
                  </p>
                  {result && (
                    <p className="mt-1 text-xs text-(--color-success)">
                      {result.message}
                      {result.freedBytes !== undefined &&
                        result.freedBytes > 0 &&
                        ` (${formatBytes(result.freedBytes)})`}
                    </p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  loading={running === action}
                  disabled={running !== null}
                  onClick={() => setPending(action)}
                >
                  Ejecutar
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? MAINTENANCE_LABELS[pending].title : ''}
        description={pending ? MAINTENANCE_LABELS[pending].description : ''}
        confirmLabel="Ejecutar"
        onConfirm={() => pending && run(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
