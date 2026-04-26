import type { ForgeConfig } from '@electron-forge/shared-types'
import { VitePlugin } from '@electron-forge/plugin-vite'
import path from 'path'
import fs from 'fs'
import { execFileSync } from 'child_process'

function findNodeFiles(dir: string, found: string[] = [], visited = new Set<string>()): string[] {
  let realDir: string
  try { realDir = fs.realpathSync(dir) } catch { return found }
  if (visited.has(realDir)) return found
  visited.add(realDir)
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(realDir, { withFileTypes: true }) } catch { return found }
  for (const entry of entries) {
    const full = path.join(realDir, entry.name)
    if (entry.isDirectory()) {
      findNodeFiles(full, found, visited)
    } else if (entry.isFile() && entry.name.endsWith('.node')) {
      found.push(full)
    } else if (entry.isSymbolicLink()) {
      try {
        const real = fs.realpathSync(full)
        const stat = fs.statSync(real)
        if (stat.isDirectory()) findNodeFiles(real, found, visited)
        else if (real.endsWith('.node') && !found.includes(real)) found.push(real)
      } catch { /* ignore broken symlinks */ }
    }
  }
  return found
}

function codesignNativeModules(appDir: string) {
  // macOS 15 Code Signing Monitor rejects native modules with the `linker-signed`
  // flag when loaded via dlopen in Electron. Re-signing with codesign removes
  // that flag and produces a standard adhoc signature that CSM accepts.
  if (process.platform !== 'darwin') return
  const nodeModulesDir = path.join(appDir, 'node_modules')
  if (!fs.existsSync(nodeModulesDir)) return
  const nodeFiles = findNodeFiles(nodeModulesDir)
  for (const file of nodeFiles) {
    try {
      execFileSync('codesign', ['--force', '--sign', '-', file])
    } catch {
      console.warn(`[queuepilot] codesign failed for ${file}`)
    }
  }
}

async function rebuildNativeModulesForElectron(appDir: string) {
  // pnpm uses symlinks: apps/desktop/node_modules/better-sqlite3 → .pnpm store.
  // forge's rebuildConfig only rebuilds the hoisted root copy, not the symlink target.
  // We resolve the real path and call @electron/rebuild explicitly on that directory.
  const { rebuild } = await import('@electron/rebuild')
  const electronPkg = JSON.parse(
    fs.readFileSync(path.join(appDir, '../../node_modules/electron/package.json'), 'utf8')
  )
  // apps/desktop/node_modules/better-sqlite3 is a symlink → .pnpm store — resolve it
  // to find where Electron actually loads the .node binary from.
  const localLink = path.join(appDir, 'node_modules/better-sqlite3')
  const realPkgPath = fs.realpathSync(localLink)
  // buildPath must be the directory containing a node_modules/better-sqlite3 folder
  const buildPath = path.join(realPkgPath, '..', '..')
  console.log(`[queuepilot] Rebuilding better-sqlite3 for Electron ${electronPkg.version}...`)
  await rebuild({
    buildPath,
    electronVersion: electronPkg.version,
    onlyModules: ['better-sqlite3'],
    force: true,
  })
  console.log('[queuepilot] Rebuild complete')
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: path.resolve(__dirname, 'resources/icon'),
    appBundleId: 'com.queuepilot.app',
    appCategoryType: 'public.app-category.productivity',
  },
  rebuildConfig: {},
  hooks: {
    postInstall: async () => codesignNativeModules(__dirname),
    preStart: async () => {
      await rebuildNativeModulesForElectron(__dirname)
      codesignNativeModules(__dirname)
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
