import type { ForgeConfig } from '@electron-forge/shared-types'
import { VitePlugin } from '@electron-forge/plugin-vite'
import path from 'path'
import fs from 'fs'
import { execFileSync } from 'child_process'

function codesignNativeModules(appDir: string) {
  // macOS 15 Code Signing Monitor rejects native modules with the `linker-signed`
  // flag when loaded via dlopen in Electron. Re-signing removes that flag and
  // produces a standard adhoc signature that CSM accepts.
  if (process.platform !== 'darwin') return
  const nodeModulesDir = path.join(appDir, 'node_modules')
  if (!fs.existsSync(nodeModulesDir)) return
  for (const entry of fs.readdirSync(nodeModulesDir, { recursive: true, withFileTypes: true }) as fs.Dirent[]) {
    if (entry.isFile() && entry.name.endsWith('.node')) {
      const full = path.join(entry.parentPath ?? (entry as { path?: string }).path ?? nodeModulesDir, entry.name)
      try {
        execFileSync('codesign', ['--force', '--sign', '-', full])
      } catch {
        console.warn(`[queuepilot] codesign failed for ${full}`)
      }
    }
  }
}

async function rebuildNativeModulesForElectron(appDir: string) {
  // pnpm hoists better-sqlite3 to workspace root but apps/desktop/node_modules/better-sqlite3
  // is a symlink into the .pnpm virtual store — that is the path Electron actually dlopen()s.
  // Using appDir (apps/desktop) as buildPath ensures @electron/rebuild finds better-sqlite3.
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
    // @electron-forge/plugin-vite only stages .vite/ output — it excludes node_modules
    // because Vite bundles JS. Native modules (`.node` binaries) can't be bundled, so
    // we copy them manually into the staging buildPath here. Forge then rebuilds them
    // for the correct Electron ABI before ASAR creation.
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
      for (const outputPath of packageResult.outputPaths) {
        const appPath = path.join(outputPath, 'QueuePilot.app')
        if (!fs.existsSync(appPath)) continue

        // electron-packager ignores packagerConfig.icon when __dirname resolves
        // incorrectly inside Forge's TS build pipeline — set the icon explicitly.
        const resourcesDir = path.join(appPath, 'Contents', 'Resources')
        const srcIcon = path.join(__dirname, 'resources', 'icon.icns')
        const destIcon = path.join(resourcesDir, 'icon.icns')
        if (fs.existsSync(srcIcon)) {
          fs.copyFileSync(srcIcon, destIcon)
          const electronIcon = path.join(resourcesDir, 'electron.icns')
          if (fs.existsSync(electronIcon)) fs.unlinkSync(electronIcon)
          const plist = path.join(appPath, 'Contents', 'Info.plist')
          execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Set :CFBundleIconFile icon.icns', plist])
          console.log('[queuepilot] Icon set: icon.icns')
        }

        // codesign --deep handles Electron framework + nested .dylibs in one pass.
        const identity = process.env.APPLE_IDENTITY ?? '-'
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
