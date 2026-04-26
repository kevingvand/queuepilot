import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    entry: 'src/main/index.ts',
    build: {
      outDir: path.resolve(__dirname, '.vite/build/main'),
      rollupOptions: {
        external: ['better-sqlite3', '@queuepilot/core', '@queuepilot/ingestion'],
      },
    },
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@queuepilot/core': path.resolve(__dirname, '../../packages/core'),
      },
    },
  },
  preload: {
    entry: 'src/preload/index.ts',
    build: {
      outDir: path.resolve(__dirname, '.vite/build/preload'),
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
  },
})
