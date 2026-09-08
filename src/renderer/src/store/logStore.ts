import { create } from 'zustand'
import type { LogEntry } from '../../../shared/types'

interface LogState {
  entries: LogEntry[]
  addEntry: (entry: LogEntry) => void
  clear: () => void
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  addEntry: (entry) =>
    set((state) => ({
      entries:
        state.entries.length > 2000
          ? [...state.entries.slice(-1999), entry]
          : [...state.entries, entry]
    })),
  clear: () => set({ entries: [] })
}))

let subscribed = false
export function initLogSubscription(): void {
  if (subscribed) return
  subscribed = true
  window.api.logs.onEntry((entry) => {
    useLogStore.getState().addEntry(entry)
  })
}
