#!/usr/bin/env node
// After `pnpm run dev`, better-sqlite3 is rebuilt for Electron ABI.
// This script restores the Node.js prebuilt so that Vitest can load it.
import { execSync } from 'child_process'
import { createRequire } from 'module'
import path from 'path'

const require = createRequire(import.meta.url)
const pkgDir = path.dirname(require.resolve('better-sqlite3/package.json'))

console.log('[queuepilot] Restoring better-sqlite3 Node.js prebuilt for tests...')
execSync('npm run install', { cwd: pkgDir, stdio: 'inherit' })
