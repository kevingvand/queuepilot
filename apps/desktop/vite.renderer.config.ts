import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  build: {
    // Anchor outDir to the project root so @electron-forge/plugin-vite's
    // ignore filter (which only packages .vite/** from the project root)
    // picks up the renderer build output correctly.
    outDir: path.resolve(__dirname, '.vite/renderer/main_window'),
    emptyOutDir: true,
  },
  css: {
    postcss: true,
  },
  server: {
    // In browser dev mode (pnpm dev:web), proxy /api to the local Hono dev server.
    // This keeps connect-src 'self' CSP satisfied — the browser only talks to localhost:5173.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
