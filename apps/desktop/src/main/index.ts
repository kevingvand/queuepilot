import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import type { Db } from '@queuepilot/core/schema'
import { createDb } from '@queuepilot/core/schema'
import type { AppType } from './api/index'
import { createApp } from './api/index'
import { registerIpcBridge } from './ipc-bridge'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string | undefined

function resolveDataDir(): string {
  const flag = process.argv.find((arg) => arg.startsWith('--data-dir='))
  if (flag) return flag.slice('--data-dir='.length)
  // In dev, use a separate directory so development never touches production data.
  // Contributors get this for free without any configuration.
  const base = app.getPath('userData')
  return app.isPackaged ? base : `${base}-dev`
}

export const dataDir = resolveDataDir()

const isDev = process.env.NODE_ENV !== 'production'
const debugLogFile = isDev ? path.join(app.getPath('userData'), 'debug.log') : null

function logDebug(msg: string) {
  if (!isDev) return
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${msg}`
  console.log(line)
  if (debugLogFile) fs.appendFileSync(debugLogFile, line + '\n', 'utf8')
}

let db: Db | undefined
let honoApp: AppType | undefined

// Forward renderer logs to main process console (dev only)
ipcMain.handle('renderer-log', (_event, level: string, args: any[]) => {
  if (!isDev) return null
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] [renderer/${level}] ${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`
  console.log(message)
  if (debugLogFile) fs.appendFileSync(debugLogFile, message + '\n', 'utf8')
  return null
})

function createWindow(): void {
  const isDevServer = !!MAIN_WINDOW_VITE_DEV_SERVER_URL

  logDebug(`Creating window, isDevServer=${isDevServer}`)

  // main.js and preload.js are siblings in .vite/build/ (both targets share outDir)
  const preloadPath = path.join(__dirname, 'preload.js')
  logDebug(`Preload path: ${preloadPath}`)
  logDebug(`Preload exists: ${fs.existsSync(preloadPath)}`)
  
  const webPreferences: any = {
    nodeIntegration: false,
    contextIsolation: true,
    preload: preloadPath,
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences,
  })

  const url = MAIN_WINDOW_VITE_DEV_SERVER_URL || `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}`
  logDebug(`Loading URL: ${url}`)
  
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  // Block unexpected navigation to external URLs
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    const allowedOrigins = isDevServer
      ? [new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL!).origin]
      : ['null'] // file:// origin
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault()
    }
  })

  // Block new windows
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Open DevTools in development
  if (isDevServer) {
    logDebug('Opening DevTools')
    win.webContents.openDevTools()
  }
}

function initializeApp() {
  fs.mkdirSync(dataDir, { recursive: true })
  db = createDb(dataDir)

  // Run migrations to ensure schema is up to date.
  // Dev: __dirname = .vite/build/ → 4 levels up = workspace root → packages/core/migrations
  // Packaged: migrations are copied to extraResources by forge
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'migrations')
    : path.resolve(__dirname, '../../../../packages/core/migrations')
  logDebug(`Running migrations from: ${migrationsFolder}`)
  migrate(db, { migrationsFolder })
  logDebug('Migrations complete')

  honoApp = createApp(db)
  registerIpcBridge(honoApp!)
}

app.whenReady().then(() => {
  logDebug(`=== QueuePilot Starting ===`)
  logDebug(`data-dir: ${dataDir}`)
  
  initializeApp()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  logDebug('All windows closed, quitting')
  if (process.platform !== 'darwin') app.quit()
})
