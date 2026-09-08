import { Hammer } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { QUICK_TOOL_LABELS } from '../lib/labels'
import type { QuickToolId } from '../../../shared/types'

const ALL_TOOLS: QuickToolId[] = [
  'cmd-admin',
  'powershell-admin',
  'terminal',
  'regedit',
  'services',
  'device-manager',
  'disk-management',
  'event-viewer',
  'task-manager',
  'system-information',
  'control-panel',
  'windows-settings',
  'computer-management'
]

export function Tools(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Card title="Herramientas rápidas" icon={<Hammer size={16} />}>
        <p className="mb-3 text-xs text-(--color-text-secondary)">
          Abre utilidades nativas de Windows con un clic. Las que requieren privilegios de
          administrador solicitarán confirmación de UAC.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ALL_TOOLS.map((tool) => (
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
    </div>
  )
}
