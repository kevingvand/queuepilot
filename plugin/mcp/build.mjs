import { build } from 'esbuild';
import { writeFileSync } from 'fs';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  external: ['better-sqlite3'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});

writeFileSync('dist/README.txt', 'better-sqlite3 must be available in node_modules/\n');
