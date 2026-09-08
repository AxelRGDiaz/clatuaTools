import { useState } from 'react'
import { Wrench, ExternalLink } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { REPAIR_LABELS, QUICK_TOOL_LABELS } from '../lib/labels'
import type {
  CommandExecutionResult,
  QuickToolId,
  WindowsRepairAction
} from '../../../shared/types'

const SYSTEM_TOOLS: QuickToolId[] = [
  'windows-update',
  'system-information',
  'device-manager',
  'disk-management',
  'services',
  'task-manager',
  'windows-settings',
  'control-panel',
  'environment-variables',
  'local-users',
  'firewall',
  'system-restore'
]

const REPAIR_ACTIONS: WindowsRepairAction[] = [
  'sfc-scannow',
  'dism-scanhealth',
  'dism-restorehealth',
  'chkdsk'
]

export function Windows(): React.JSX.Element {
  const [pending, setPending] = useState<WindowsRepairAction | null>(null)
  const [running, setRunning] = useState<WindowsRepairAction | null>(null)
  const [results, setResults] = useState<Record<string, CommandExecutionResult>>({})

  const runRepair = async (action: WindowsRepairAction): Promise<void> => {
    setPending(null)
    setRunning(action)
    const result = await window.api.windows.runRepair(action)
    setResults((r) => ({ ...r, [action]: result }))
    setRunning(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Herramientas de Windows" icon={<ExternalLink size={16} />}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SYSTEM_TOOLS.map((tool) => (
            <Button
              key={tool}
              variant="secondary"
              onClick={() => window.api.windows.openTool(tool)}
            >
              {QUICK_TOOL_LABELS[tool]}
            </Button>
          ))}
        </div>
      </Card>

      <Card title="Reparación del sistema" icon={<Wrench size={16} />}>
        <p className="mb-3 text-xs text-(--color-text-secondary)">
          Estas herramientas requieren privilegios de administrador y pueden tardar varios minutos.
          Se pedirá confirmación antes de ejecutarlas.
        </p>
        <div className="flex flex-col gap-2">
          {REPAIR_ACTIONS.map((action) => {
            const result = results[action]
            return (
              <div
                key={action}
                className="flex items-center justify-between gap-3 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-(--color-text-primary)">
                    {REPAIR_LABELS[action].title}
                  </p>
                  <p className="text-xs text-(--color-text-secondary)">
                    {REPAIR_LABELS[action].description}
                  </p>
                  {result && (
                    <Badge tone={result.success ? 'success' : 'danger'}>
                      {result.success ? 'Completado' : `Error (código ${result.exitCode ?? '?'})`}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="primary"
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
        title={pending ? REPAIR_LABELS[pending].title : ''}
        description={pending ? REPAIR_LABELS[pending].description : ''}
        requiresAdmin={pending ? REPAIR_LABELS[pending].requiresAdmin : false}
        confirmLabel="Ejecutar"
        onConfirm={() => pending && runRepair(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
