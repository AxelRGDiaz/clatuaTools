import { create } from 'zustand'

// El Centro de tareas vive en un store a nivel de módulo (no en una página),
// así las operaciones largas —winget, SFC, DISM, recetas— siguen su curso
// aunque el técnico cambie de pantalla, y el progreso no se pierde.

export type TaskStatus = 'queued' | 'running' | 'success' | 'error'

export interface Task {
  id: string
  title: string
  subtitle?: string
  status: TaskStatus
  // null = progreso indeterminado (no sabemos el porcentaje real).
  progress: number | null
  message?: string
  createdAt: number
  startedAt?: number
  finishedAt?: number
}

export interface TaskRunContext {
  setProgress: (value: number | null) => void
  setMessage: (message: string) => void
}

export interface TaskOutcome {
  success: boolean
  message?: string
}

let counter = 0
function nextId(): string {
  counter += 1
  return `task-${Date.now()}-${counter}`
}

interface RunOptions {
  title: string
  subtitle?: string
  indeterminate?: boolean
}

interface TaskState {
  tasks: Task[]
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  patch: (id: string, patch: Partial<Task>) => void
  run: (
    opts: RunOptions,
    fn: (ctx: TaskRunContext) => Promise<TaskOutcome | void>
  ) => Promise<TaskOutcome>
  clearFinished: () => void
  remove: (id: string) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  patch: (id, patch) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  run: async (opts, fn) => {
    const id = nextId()
    const task: Task = {
      id,
      title: opts.title,
      subtitle: opts.subtitle,
      status: 'running',
      progress: opts.indeterminate ? null : 0,
      createdAt: Date.now(),
      startedAt: Date.now()
    }
    set((s) => ({ tasks: [task, ...s.tasks], open: true }))

    const ctx: TaskRunContext = {
      setProgress: (value) => get().patch(id, { progress: value }),
      setMessage: (message) => get().patch(id, { message })
    }

    try {
      const outcome = (await fn(ctx)) ?? { success: true }
      get().patch(id, {
        status: outcome.success ? 'success' : 'error',
        message: outcome.message,
        progress: outcome.success ? 100 : (get().tasks.find((t) => t.id === id)?.progress ?? null),
        finishedAt: Date.now()
      })
      return outcome
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      get().patch(id, { status: 'error', message, finishedAt: Date.now() })
      return { success: false, message }
    }
  },
  clearFinished: () =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.status === 'running' || t.status === 'queued')
    })),
  remove: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
}))

export function runningTaskCount(tasks: Task[]): number {
  return tasks.filter((t) => t.status === 'running' || t.status === 'queued').length
}
