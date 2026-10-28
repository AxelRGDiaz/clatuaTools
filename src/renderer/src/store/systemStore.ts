import { create } from 'zustand'
import type { SystemSnapshot } from '../../../shared/types'

interface SystemState {
  snapshot: SystemSnapshot | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  // Para el montaje de páginas: no repite la captura si es reciente.
  ensureFresh: () => Promise<void>
}

const FRESH_MS = 30_000

export const useSystemStore = create<SystemState>((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,
  ensureFresh: async () => {
    const { snapshot, loading, refresh } = get()
    if (loading) return
    if (snapshot && Date.now() - new Date(snapshot.timestamp).getTime() < FRESH_MS) return
    await refresh()
  },
  refresh: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const snapshot = await window.api.system.getSnapshot()
      set({ snapshot, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
}))
