import { useState } from 'react'
import {
  ListChecks,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  MinusCircle,
  ShieldAlert
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { RECIPES, type Recipe } from '../lib/recipes'
import { findAction } from '../lib/actions'
import { runRecipe, type StepStatus } from '../lib/runRecipe'

interface RunState {
  recipeId: string
  steps: Record<string, { status: StepStatus; message?: string }>
}

function StepIcon({ status }: { status: StepStatus }): React.JSX.Element {
  switch (status) {
    case 'running':
      return <Loader2 size={15} className="animate-spin text-(--color-accent)" />
    case 'success':
      return <CheckCircle2 size={15} className="text-(--color-success)" />
    case 'error':
      return <XCircle size={15} className="text-(--color-danger)" />
    case 'skipped':
      return <MinusCircle size={15} className="text-(--color-text-muted)" />
    default:
      return <Circle size={15} className="text-(--color-text-muted)" />
  }
}

function RecipeCard({
  recipe,
  run,
  busy,
  onRun
}: {
  recipe: Recipe
  run: RunState | null
  busy: boolean
  onRun: (r: Recipe) => void
}): React.JSX.Element {
  const steps = recipe.stepActionIds.map((id) => ({ id, action: findAction(id) }))
  const needsAdmin = steps.some((s) => s.action?.requiresAdmin)
  const isRunning = busy && run?.recipeId === recipe.id

  return (
    <Card
      title={recipe.name}
      icon={<ListChecks size={16} />}
      action={
        <Button
          variant="primary"
          icon={<Play size={14} />}
          loading={isRunning}
          disabled={busy}
          onClick={() => onRun(recipe)}
        >
          Ejecutar
        </Button>
      }
    >
      <p className="mb-3 text-xs text-(--color-text-secondary)">{recipe.description}</p>
      {needsAdmin && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-(--color-warning)">
          <ShieldAlert size={13} />
          Algún paso requiere privilegios de administrador.
        </p>
      )}
      <ol className="flex flex-col gap-1.5">
        {steps.map(({ id, action }, i) => {
          const state = run?.recipeId === recipe.id ? run.steps[id] : undefined
          const status: StepStatus = state?.status ?? 'pending'
          return (
            <li
              key={id}
              className="flex items-center gap-2.5 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2"
            >
              <span className="shrink-0">
                <StepIcon status={status} />
              </span>
              <span className="text-xs font-medium text-(--color-text-muted)">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-(--color-text-primary)">
                  {action ? action.title : id}
                </span>
                {state?.message && (
                  <span
                    className={
                      status === 'error'
                        ? 'block truncate text-xs text-(--color-danger)'
                        : 'block truncate text-xs text-(--color-text-muted)'
                    }
                  >
                    {state.message}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export function Recipes(): React.JSX.Element {
  const [run, setRun] = useState<RunState | null>(null)
  const [busy, setBusy] = useState(false)

  const handleRun = async (recipe: Recipe): Promise<void> => {
    const steps: RunState['steps'] = {}
    recipe.stepActionIds.forEach((id) => (steps[id] = { status: 'pending' }))
    setRun({ recipeId: recipe.id, steps })
    setBusy(true)

    await runRecipe(recipe, (actionId, status, message) => {
      setRun((prev) =>
        prev && prev.recipeId === recipe.id
          ? { ...prev, steps: { ...prev.steps, [actionId]: { status, message } } }
          : prev
      )
    })

    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-(--color-text-secondary)">
        Flujos guiados que encadenan varias acciones en orden. Cada paso corre en el Centro de
        tareas y su estado se muestra en vivo. Las operaciones largas no se pierden si cambias de
        pantalla.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {RECIPES.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} run={run} busy={busy} onRun={handleRun} />
        ))}
      </div>
    </div>
  )
}
