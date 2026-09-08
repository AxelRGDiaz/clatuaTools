import { create } from 'zustand'
import type { SystemSnapshot } from '../../../shared/types'

interface SystemState {
  snapshot: SystemSnapshot | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const useSystemStore = create<SystemState>((set) => ({
  snapshot: null,
  loading: false,
  error: null,
  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const snapshot = await window.api.system.getSnapshot()
      set({ snapshot, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
}))
