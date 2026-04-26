import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    entry: 'src/main/index.ts',
    build: {
      outDir: path.resolve(__dirname, '.vite/build/main'),
      lib: {
        entry: 'src/main/index.ts',
        formats: ['cjs'],
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    entry: 'src/preload/index.ts',
    build: {
      outDir: path.resolve(__dirname, '.vite/build/preload'),
      lib: {
        entry: 'src/preload/index.ts',
        formats: ['cjs'],
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
  },
})
