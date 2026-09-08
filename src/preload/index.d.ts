import type { ClatuaApi } from './index'

declare global {
  interface Window {
    api: ClatuaApi
  }
}
