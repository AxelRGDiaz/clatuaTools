import { useTaskStore } from '../store/taskStore'
import { findAction } from './actions'
import type { Recipe } from './recipes'

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

// Ejecuta una receta paso a paso. Cada paso corre a través del Centro de
// tareas (así se ve el progreso y sobrevive a la navegación). `onStep` permite
// a la página de Recetas reflejar el estado de cada paso en vivo.
export async function runRecipe(
  recipe: Recipe,
  onStep?: (actionId: string, status: StepStatus, message?: string) => void
): Promise<void> {
  const run = useTaskStore.getState().run
  let aborted = false

  for (const actionId of recipe.stepActionIds) {
    const action = findAction(actionId)
    if (!action) {
      onStep?.(actionId, 'error', 'Acción desconocida.')
      continue
    }
    if (aborted) {
      onStep?.(actionId, 'skipped')
      continue
    }

    onStep?.(actionId, 'running')
    const outcome = await run(
      {
        title: action.title,
        subtitle: `Receta · ${recipe.name}`,
        indeterminate: action.indeterminate
      },
      () => action.run()
    )
    onStep?.(actionId, outcome.success ? 'success' : 'error', outcome.message)

    if (!outcome.success && recipe.stopOnError) aborted = true
  }
}
