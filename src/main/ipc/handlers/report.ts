import { ipcMain } from 'electron'
import { IpcChannels } from '../../../shared/ipc-channels'
import type { ReportExportPayload } from '../../../shared/types'
import { exportReportPdf } from '../../services/report.service'

export function registerReportHandlers(): void {
  ipcMain.handle(IpcChannels.reportExportPdf, (_event, payload: ReportExportPayload) =>
    exportReportPdf(payload)
  )
}
