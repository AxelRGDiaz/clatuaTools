import { create } from 'zustand'

export const PAGE_IDS = [
  'home',
  'recipes',
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
  'report',
  'settings'
] as const

export type PageId = (typeof PAGE_IDS)[number]

interface NavState {
  activePage: PageId
  logPanelOpen: boolean
  paletteOpen: boolean
  setActivePage: (page: PageId) => void
  toggleLogPanel: () => void
  setPaletteOpen: (open: boolean) => void
  togglePalette: () => void
}

export const useNavStore = create<NavState>((set) => ({
  activePage: 'home',
  logPanelOpen: true,
  paletteOpen: false,
  setActivePage: (page) => set({ activePage: page }),
  toggleLogPanel: () => set((s) => ({ logPanelOpen: !s.logPanelOpen })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen }))
}))
