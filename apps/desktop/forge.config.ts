import type { ForgeConfig } from '@electron-forge/shared-types'
import { VitePlugin } from '@electron-forge/plugin-vite'
import path from 'path'
import fs from 'fs'
import { buildSync } from 'esbuild'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  hooks: {
    preStart: async () => {
      const { execSync } = await import('child_process')
      try {
        console.log('[queuepilot] Rebuilding native modules for Electron...')
        execSync('pnpm exec electron-rebuild -f -w better-sqlite3', {
          cwd: __dirname,
          stdio: 'inherit',
        })
      } catch (e) {
        console.warn('[queuepilot] Warning: failed to rebuild native modules')
      }
      
      // Ensure .vite/build directory exists
      const buildDir = path.join(__dirname, '.vite/build')
      fs.mkdirSync(buildDir, { recursive: true })
      
      // Build preload.js with esbuild directly
      const preloadPath = path.join(buildDir, 'preload.js')
      try {
        console.log('[queuepilot] Building preload with esbuild...')
        buildSync({
          entryPoints: [path.join(__dirname, 'src/preload/index.ts')],
          bundle: true,
          platform: 'node',
          target: 'node20',
          format: 'cjs',
          outfile: preloadPath,
          external: ['electron'],
          sourcemap: false,
          logLevel: 'error',
        })
        console.log('[queuepilot] Preload built successfully')
      } catch (err) {
        console.error('[queuepilot] Failed to build preload:', err)
      }
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'electron.vite.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'electron.vite.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
}

export default config
