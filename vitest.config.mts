import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

import tsconfig from './tsconfig.json';

export default defineConfig({
  resolve: {
    alias: Object.entries(tsconfig.compilerOptions.paths)
      .map(([alias, paths]) => ({
        find: alias.replace(/\/\*$/, ''),
        replacement: resolve(import.meta.dirname, paths[0].replace(/\/\*$/, '')),
      }))
      .sort((a, b) => b.find.length - a.find.length),
    extensions: ['.ios.ts', '.ios.tsx', '.android.ts', '.android.tsx', '.ios.js', '.android.js', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['config/test/**/*.test.ts', 'src/**/*.{test,spec}.{ts,tsx,js,jsx}', 'tools/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    server: { deps: { inline: ['@storesjs/stores', 'react-native-mmkv'] } },
    setupFiles: ['config/test/setup.ts'],
    pool: 'threads',
    maxWorkers: '50%',
  },
});
