import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      // Only externalize the native binary — it cannot be bundled by Vite/Rollup
      // and is instead copied to app.asar.unpacked via the packageAfterCopy hook.
      // All pure-JS deps (hono, zod, etc.) are bundled directly into index.js so
      // they are available without node_modules being present in the package.
      external: ['better-sqlite3'],
    },
  },
  resolve: {
    alias: {
      '@queuepilot/core': path.resolve(__dirname, '../../packages/core/src'),
      '@queuepilot/ingestion': path.resolve(__dirname, '../../packages/ingestion/src'),
    },
  },
})

