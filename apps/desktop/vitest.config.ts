import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@queuepilot/core/schema': path.resolve(__dirname, '../../packages/core/src/schema/index.ts'),
      '@queuepilot/core/types': path.resolve(__dirname, '../../packages/core/src/types/index.ts'),
      '@queuepilot/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/main/api/**'],
    },
  },
});
