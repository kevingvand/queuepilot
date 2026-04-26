import { app, BrowserWindow } from 'electron'
import path from 'path'

const dataDir = resolveDataDir()

function resolveDataDir(): string {
  const flag = process.argv.find((arg) => arg.startsWith('--data-dir='))
  return flag ? flag.slice('--data-dir='.length) : app.getPath('userData')
}

export { dataDir }

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }
}

app.whenReady().then(() => {
  console.log(`[queuepilot] data-dir: ${dataDir}`)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
