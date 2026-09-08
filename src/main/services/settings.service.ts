// Persists app settings as JSON under Electron's userData directory. This
// is the "settings.json" referenced in the spec — it is created on first
// run from settings.default.json and merged/validated on every write.

import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { AppSettings } from '../../shared/types'
import defaultSettings from '../config/settings.default.json'
import { logger } from './logger.service'

let cache: AppSettings | null = null

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

function sanitize(input: Partial<AppSettings>, base: AppSettings): AppSettings {
  return {
    appName:
      typeof input.appName === 'string' && input.appName.trim()
        ? input.appName.trim()
        : base.appName,
    theme: input.theme === 'light' ? 'light' : 'dark',
    technicalMode:
      typeof input.technicalMode === 'boolean' ? input.technicalMode : base.technicalMode,
    autoStart: typeof input.autoStart === 'boolean' ? input.autoStart : base.autoStart,
    uacBehavior:
      input.uacBehavior === 'silent-when-possible' ? 'silent-when-possible' : 'always-ask',
    logRetentionDays:
      typeof input.logRetentionDays === 'number' && input.logRetentionDays > 0
        ? input.logRetentionDays
        : base.logRetentionDays
  }
}

export function getSettings(): AppSettings {
  if (cache) return cache

  const filePath = getSettingsPath()
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    cache = sanitize(JSON.parse(raw), defaultSettings as AppSettings)
  } catch {
    cache = { ...(defaultSettings as AppSettings) }
  }
  return cache
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const next = sanitize({ ...current, ...partial }, current)
  cache = next
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  } catch (err) {
    logger.error(
      `No se pudo guardar la configuración: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (next.autoStart !== current.autoStart) {
    app.setLoginItemSettings({ openAtLogin: next.autoStart })
  }

  return next
}
