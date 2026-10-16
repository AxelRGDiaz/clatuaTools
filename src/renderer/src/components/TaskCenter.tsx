import { Loader2, CheckCircle2, XCircle, Clock, X, ListChecks, Trash2 } from 'lucide-react'
import { cn } from '../lib/cn'
import { useTaskStore, type Task, type TaskStatus } from '../store/taskStore'
import { ProgressBar } from './ProgressBar'

function StatusIcon({ status }: { status: TaskStatus }): React.JSX.Element {
  switch (status) {
    case 'running':
      return <Loader2 size={15} className="animate-spin text-(--color-accent)" />
    case 'success':
      return <CheckCircle2 size={15} className="text-(--color-success)" />
    case 'error':
      return <XCircle size={15} className="text-(--color-danger)" />
    default:
      return <Clock size={15} className="text-(--color-text-muted)" />
  }
}

function TaskRow({ task }: { task: Task }): React.JSX.Element {
  const remove = useTaskStore((s) => s.remove)
  const finished = task.status === 'success' || task.status === 'error'

  return (
    <div className="rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          <StatusIcon status={task.status} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-(--color-text-primary)">{task.title}</p>
          {task.subtitle && (
            <p className="truncate text-xs text-(--color-text-muted)">{task.subtitle}</p>
          )}
        </div>
        {finished && (
          <button
            onClick={() => remove(task.id)}
            title="Quitar de la lista"
            className="shrink-0 rounded p-1 text-(--color-text-muted) hover:bg-(--color-surface-3) hover:text-(--color-text-primary) cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {task.status === 'running' && (
        <div className="mt-2.5">
          {task.progress === null ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-3)">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-(--color-accent)" />
            </div>
          ) : (
            <ProgressBar value={task.progress} />
          )}
        </div>
      )}

      {task.message && (
        <p
          className={cn(
            'mt-2 text-xs',
            task.status === 'error' ? 'text-(--color-danger)' : 'text-(--color-text-secondary)'
          )}
        >
          {task.message}
        </p>
      )}
    </div>
  )
}

export function TaskCenter(): React.JSX.Element | null {
  const open = useTaskStore((s) => s.open)
  const setOpen = useTaskStore((s) => s.setOpen)
  const tasks = useTaskStore((s) => s.tasks)
  const clearFinished = useTaskStore((s) => s.clearFinished)

  if (!open) return null

  const active = tasks.filter((t) => t.status === 'running' || t.status === 'queued')
  const done = tasks.filter((t) => t.status === 'success' || t.status === 'error')

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className="animate-fade-in relative flex h-full w-[340px] flex-col border-l border-(--color-surface-border) bg-(--color-surface-1) shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-(--color-surface-border) px-4">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-(--color-accent)" />
            <h2 className="text-sm font-semibold text-(--color-text-primary)">Centro de tareas</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text-primary) cursor-pointer"
            aria-label="Cerrar centro de tareas"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tasks.length === 0 ? (
            <p className="mt-6 text-center text-sm text-(--color-text-muted)">
              Sin tareas por ahora. Las operaciones largas aparecerán aquí.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {active.length > 0 && (
                <>
                  <p className="text-[10.5px] font-semibold tracking-wider text-(--color-text-muted) uppercase">
                    En curso · {active.length}
                  </p>
                  {active.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </>
              )}
              {done.length > 0 && (
                <>
                  <p className="mt-1 text-[10.5px] font-semibold tracking-wider text-(--color-text-muted) uppercase">
                    Terminadas · {done.length}
                  </p>
                  {done.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {done.length > 0 && (
          <div className="shrink-0 border-t border-(--color-surface-border) p-3">
            <button
              onClick={clearFinished}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-(--color-surface-border) py-2 text-xs text-(--color-text-secondary) hover:bg-(--color-surface-2) hover:text-(--color-text-primary) cursor-pointer"
            >
              <Trash2 size={13} />
              Limpiar terminadas
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
