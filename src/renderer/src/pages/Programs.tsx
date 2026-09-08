import { useEffect, useMemo, useState } from 'react'
import { Download, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import type { AppCategory, AppEntry, WingetStatus } from '../../../shared/types'

const CATEGORY_LABELS: Record<AppCategory, string> = {
  browsers: 'Navegadores',
  utilities: 'Utilidades',
  development: 'Desarrollo',
  communication: 'Comunicación',
  multimedia: 'Multimedia'
}

type InstallState = 'idle' | 'checking' | 'installing' | 'installed' | 'error'

export function Programs(): React.JSX.Element {
  const [apps, setApps] = useState<AppEntry[]>([])
  const [winget, setWinget] = useState<WingetStatus | null>(null)
  const [states, setStates] = useState<Record<string, InstallState>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})

  useEffect(() => {
    window.api.programs.list().then((list) => {
      setApps(list)
      list.forEach((app) => {
        setStates((s) => ({ ...s, [app.id]: 'checking' }))
        window.api.programs.checkInstalled(app.id).then((installed) => {
          setStates((s) => ({ ...s, [app.id]: installed ? 'installed' : 'idle' }))
        })
      })
    })
    window.api.programs.checkWinget().then(setWinget)
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<AppCategory, AppEntry[]>()
    for (const app of apps) {
      const list = map.get(app.category) ?? []
      list.push(app)
      map.set(app.category, list)
    }
    return map
  }, [apps])

  const handleInstall = async (app: AppEntry): Promise<void> => {
    setStates((s) => ({ ...s, [app.id]: 'installing' }))
    const result = await window.api.programs.installOne(app.id)
    setMessages((m) => ({ ...m, [app.id]: result.message }))
    setStates((s) => ({ ...s, [app.id]: result.success ? 'installed' : 'error' }))
  }

  return (
    <div className="flex flex-col gap-4">
      {winget && !winget.available && (
        <Card className="border-(--color-warning)/40">
          <div className="flex items-center gap-2 text-sm text-(--color-warning)">
            <AlertTriangle size={16} />
            winget no está disponible en este equipo. Instálalo desde la Microsoft Store (App
            Installer) para poder instalar programas automáticamente.
          </div>
        </Card>
      )}

      {[...grouped.entries()].map(([category, categoryApps]) => (
        <Card key={category} title={CATEGORY_LABELS[category]}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categoryApps.map((app) => {
              const state = states[app.id] ?? 'idle'
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-(--color-text-primary)">
                      {app.name}
                    </p>
                    <p className="truncate text-xs text-(--color-text-secondary)">
                      {app.description}
                    </p>
                    {state === 'error' && messages[app.id] && (
                      <p
                        className="mt-1 truncate text-xs text-(--color-danger)"
                        title={messages[app.id]}
                      >
                        {messages[app.id]}
                      </p>
                    )}
                  </div>
                  {state === 'installed' ? (
                    <Badge tone="success">
                      <CheckCircle2 size={12} /> Instalado
                    </Badge>
                  ) : state === 'installing' || state === 'checking' ? (
                    <Loader2 size={16} className="shrink-0 animate-spin text-(--color-accent)" />
                  ) : (
                    <Button
                      variant="secondary"
                      className="shrink-0 !px-2.5 !py-1.5"
                      icon={<Download size={13} />}
                      onClick={() => handleInstall(app)}
                      disabled={winget ? !winget.available : false}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
