import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
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
