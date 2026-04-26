import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { createApp } from './api/index'
import { registerIpcBridge } from './ipc-bridge'
import { createDb } from '@queuepilot/core/schema'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string | undefined

function resolveDataDir(): string {
  const flag = process.argv.find((arg) => arg.startsWith('--data-dir='))
  return flag ? flag.slice('--data-dir='.length) : app.getPath('userData')
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

let db: any
let honoApp: any

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
  const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL
  
  logDebug(`Creating window, isDev=${isDev}`)
  
  const preloadPath = path.join(__dirname, '../build/preload.js')
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
    const allowedOrigins = isDev
      ? [new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL!).origin]
      : ['null'] // file:// origin
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault()
    }
  })

  // Block new windows
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Open DevTools in development
  if (isDev) {
    logDebug('Opening DevTools')
    win.webContents.openDevTools()
  }
}

function initializeApp() {
  db = createDb(dataDir)
  honoApp = createApp(db)
  registerIpcBridge(honoApp)
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
