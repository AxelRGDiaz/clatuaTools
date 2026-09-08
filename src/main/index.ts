import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerAllIpcHandlers } from './ipc/registerHandlers'
import { logger } from './services/logger.service'
import { IpcChannels } from '../shared/ipc-channels'
import { isElevated } from './services/admin.service'
import { isWindows } from './security/platform'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0f14',
    // Packaged Windows builds get their icon embedded by electron-builder
    // from build/icon.ico automatically, but `npm run dev`/`preview` never
    // go through that step, so without this the taskbar/window would show
    // Electron's default icon during development on every platform.
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.clatuatech.tools')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAllIpcHandlers()

  // Forward every log entry to all renderer windows so the log panel stays
  // live regardless of which action produced it.
  logger.on('entry', (entry) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IpcChannels.logsAppend, entry)
    }
  })

  logger.info('ClatuaTech Tools iniciado.')
  if (isWindows) {
    const elevated = await isElevated()
    logger.info(
      elevated
        ? 'Ejecutando con privilegios de administrador.'
        : 'Ejecutando sin privilegios de administrador.'
    )
  } else {
    logger.warning(
      'Plataforma de desarrollo distinta de Windows detectada: las funciones específicas de Windows quedarán deshabilitadas.'
    )
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
