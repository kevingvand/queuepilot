import type { ForgeConfig } from '@electron-forge/shared-types'
import { VitePlugin } from '@electron-forge/plugin-vite'

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
