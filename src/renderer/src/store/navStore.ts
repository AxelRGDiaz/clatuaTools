import { create } from 'zustand'

export const PAGE_IDS = [
  'home',
  'programs',
  'quick-install',
  'windows',
  'office',
  'drivers',
  'diagnostics',
  'maintenance',
  'network',
  'tools',
  'activation',
  'settings'
] as const

export type PageId = (typeof PAGE_IDS)[number]

interface NavState {
  activePage: PageId
  logPanelOpen: boolean
  setActivePage: (page: PageId) => void
  toggleLogPanel: () => void
}

export const useNavStore = create<NavState>((set) => ({
  activePage: 'home',
  logPanelOpen: true,
  setActivePage: (page) => set({ activePage: page }),
  toggleLogPanel: () => set((s) => ({ logPanelOpen: !s.logPanelOpen }))
}))
