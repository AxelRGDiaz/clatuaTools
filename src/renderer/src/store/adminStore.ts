import { create } from 'zustand'

interface AdminState {
  isElevated: boolean
  checked: boolean
  refresh: () => Promise<void>
  relaunchAsAdmin: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set) => ({
  isElevated: false,
  checked: false,
  refresh: async () => {
    const isElevated = await window.api.admin.isElevated()
    set({ isElevated, checked: true })
  },
  relaunchAsAdmin: async () => {
    await window.api.admin.relaunchAsAdmin()
  }
}))
