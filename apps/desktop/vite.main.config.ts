import { defineConfig } from 'vite'
import { externalizeDepsPlugin } from 'electron-vite'
import path from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      // Only externalize native binaries — workspace packages are bundled so
      // Vite resolves their TypeScript sources directly (no compiled .js needed).
      external: ['better-sqlite3'],
    },
  },
  plugins: [externalizeDepsPlugin({ exclude: ['@queuepilot/core', '@queuepilot/ingestion'] })],
  resolve: {
    alias: {
      '@queuepilot/core': path.resolve(__dirname, '../../packages/core/src'),
      '@queuepilot/ingestion': path.resolve(__dirname, '../../packages/ingestion/src'),
    },
  },
})

