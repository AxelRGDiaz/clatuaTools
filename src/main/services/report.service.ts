// Genera el "Informe de entrega" en PDF. El renderer envía el HTML ya
// maquetado; aquí sólo se pide dónde guardarlo, se renderiza en una ventana
// oculta y se imprime a PDF con la API nativa de Electron. No se descarga ni
// ejecuta nada externo: todo ocurre en local.

import { BrowserWindow, dialog } from 'electron'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import type { ReportExportPayload, ReportExportResult } from '../../shared/types'
import { logger } from './logger.service'

export async function exportReportPdf(payload: ReportExportPayload): Promise<ReportExportResult> {
  const { html, defaultFileName } = payload

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar informe de entrega',
    defaultPath: defaultFileName,
    filters: [{ name: 'Documento PDF', extensions: ['pdf'] }]
  })

  if (canceled || !filePath) {
    return { ok: false, canceled: true }
  }

  const tmpHtml = join(tmpdir(), `clatua-report-${Date.now()}.html`)

  // Ventana oculta y aislada sólo para renderizar e imprimir el documento.
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, javascript: false }
  })

  try {
    await writeFile(tmpHtml, html, 'utf8')
    await win.loadFile(tmpHtml)

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
    })

    await writeFile(filePath, pdf)
    logger.success(`Informe de entrega guardado en ${filePath}`)
    return { ok: true, path: filePath }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`No se pudo generar el informe PDF: ${message}`)
    return { ok: false, error: message }
  } finally {
    if (!win.isDestroyed()) win.destroy()
    unlink(tmpHtml).catch(() => {})
  }
}
