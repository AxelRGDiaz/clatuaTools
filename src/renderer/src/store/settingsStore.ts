import { create } from 'zustand'
import type { AppSettings } from '../../../shared/types'

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  load: () => Promise<void>
  // Devuelve la configuración tal como quedó guardada (ya saneada por el main).
  update: (partial: Partial<AppSettings>) => Promise<AppSettings>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  load: async () => {
    set({ loading: true })
    const settings = await window.api.settings.get()
    set({ settings, loading: false })
    applyTheme(settings.theme)
  },
  update: async (partial) => {
    const current = get().settings
    const settings = await window.api.settings.set(partial)
    set({ settings })
    if (!current || current.theme !== settings.theme) applyTheme(settings.theme)
    return settings
  }
}))

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme)
}
