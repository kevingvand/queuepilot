import { defineConfig } from 'vite'
import { externalizeDepsPlugin } from 'electron-vite'

// Preload runs in Electron's sandboxed renderer context.
// Externalize everything — only the bridge API surface is needed here.
export default defineConfig({
  plugins: [externalizeDepsPlugin()],
})

