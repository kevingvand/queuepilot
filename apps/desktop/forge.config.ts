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
  // pnpm hoists better-sqlite3 to workspace root but apps/desktop/node_modules/better-sqlite3
  // is a symlink to the .pnpm virtual store — that is the path Electron actually dlopen()s.
  //
  // @electron/rebuild walks the deps of buildPath/package.json; using workspaceRoot misses
  // better-sqlite3 since it's a dep of apps/desktop, not the workspace root.
  // Using appDir (apps/desktop) correctly identifies it, follows the symlink into .pnpm,
  // and runs prebuild-install --runtime=electron there.
  const { rebuild } = await import('@electron/rebuild')
  const electronPkg = JSON.parse(
    fs.readFileSync(path.join(appDir, '../../node_modules/electron/package.json'), 'utf8')
  )
  console.log(`[queuepilot] Rebuilding better-sqlite3 for Electron ${electronPkg.version}...`)
  await rebuild({
    buildPath: appDir,
    electronVersion: electronPkg.version,
    onlyModules: ['better-sqlite3'],
    force: true,
  })
  console.log('[queuepilot] Rebuild complete')
}

const config: ForgeConfig = {
  packagerConfig: {
    name: 'QueuePilot',
    executableName: 'queuepilot',
    asar: {
      unpack: '**/*.node',
    },
    icon: path.resolve(__dirname, 'resources/icon'),
    appBundleId: 'com.queuepilot.app',
    appCategoryType: 'public.app-category.productivity',
    extraResource: [
      path.resolve(__dirname, '../../packages/core/migrations'),
    ],
  },
  rebuildConfig: {
    // Point forge's native-module rebuild at apps/desktop so it finds
    // better-sqlite3 (a dep of desktop, not the workspace root).
    // This matters on CI where pnpm runs forge from a filter command.
    buildPath: __dirname,
  },
  hooks: {
    postInstall: async () => codesignNativeModules(__dirname),
    preStart: async () => {
      await rebuildNativeModulesForElectron(__dirname)
      codesignNativeModules(__dirname)
    },
    // @electron-forge/plugin-vite only packages .vite/ output — it excludes node_modules
    // entirely because it assumes Vite bundles all JS. Native modules cannot be bundled
    // by Vite, so we manually copy them into the staging buildPath here. Forge's own
    // native-module rebuild step then recompiles them for Electron before ASAR creation.
    packageAfterCopy: async (_config, buildPath) => {
      const nativeDeps = ['better-sqlite3', 'bindings', 'file-uri-to-path']
      const destNodeModules = path.join(buildPath, 'node_modules')
      fs.mkdirSync(destNodeModules, { recursive: true })

      for (const dep of nativeDeps) {
        let pkgJsonPath: string
        try {
          pkgJsonPath = require.resolve(`${dep}/package.json`, { paths: [__dirname] })
        } catch {
          console.warn(`[queuepilot] Could not resolve ${dep} — skipping`)
          continue
        }
        const srcDir = path.dirname(fs.realpathSync(pkgJsonPath))
        const destDir = path.join(destNodeModules, dep)
        if (!fs.existsSync(destDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true, dereference: true })
          console.log(`[queuepilot] Copied native dep: ${dep}`)
        }
      }
    },
    postPackage: async (_forgeConfig, packageResult) => {
      if (process.platform !== 'darwin') return
      const identity = process.env.APPLE_IDENTITY ?? '-'
      for (const outputPath of packageResult.outputPaths) {
        const appPath = path.join(outputPath, 'QueuePilot.app')
        if (!fs.existsSync(appPath)) continue
        // codesign --deep handles Electron framework + nested .dylibs in one pass.
        // No --options runtime → no entitlements needed (ad-hoc or Developer ID).
        // This produces a valid structural signature that macOS shows as
        // "unidentified developer" (right-click > Open) rather than "damaged".
        execFileSync('codesign', ['--force', '--deep', '--sign', identity, appPath], {
          stdio: 'pipe',
        })
        console.log(`[queuepilot] Signed: ${appPath}`)
      }
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'QueuePilot',
        authors: 'QueuePilot Contributors',
        description: 'A local-first task queue companion for humans and AI agents',
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        format: 'ULFO',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['linux'],
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
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
