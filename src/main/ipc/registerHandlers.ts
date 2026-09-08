import { registerSystemHandlers } from './handlers/system'
import { registerAdminHandlers } from './handlers/admin'
import { registerProgramsHandlers } from './handlers/programs'
import { registerWindowsHandlers } from './handlers/windows'
import { registerMaintenanceHandlers } from './handlers/maintenance'
import { registerOfficeHandlers } from './handlers/office'
import { registerActivationHandlers } from './handlers/activation'
import { registerDriversHandlers } from './handlers/drivers'
import { registerLogsHandlers } from './handlers/logs'
import { registerSettingsHandlers } from './handlers/settings'

export function registerAllIpcHandlers(): void {
  registerSystemHandlers()
  registerAdminHandlers()
  registerProgramsHandlers()
  registerWindowsHandlers()
  registerMaintenanceHandlers()
  registerOfficeHandlers()
  registerActivationHandlers()
  registerDriversHandlers()
  registerLogsHandlers()
  registerSettingsHandlers()
}
