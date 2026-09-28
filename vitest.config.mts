import { resolve } from 'node:path';

import { reactNative } from 'vitest-native';
import { configDefaults, defineConfig } from 'vitest/config';

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
    isolate: true,
    clearMocks: false,
    server: { deps: { inline: ['@storesjs/stores', 'react-native-mmkv'] } },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['config/test/**/*.test.ts', 'src/**/*.{test,spec}.{ts,tsx,js,jsx}', 'tools/**/*.{test,spec}.{ts,tsx,js,jsx}'],
          exclude: [...configDefaults.exclude, '**/*.native.test.tsx'],
          setupFiles: ['config/test/node.ts'],
        },
      },
      {
        extends: true,
        plugins: [
          reactNative({ engine: 'native', presets: [] }),
          {
            name: 'native-test-setup',
            config: () => ({ test: { setupFiles: ['config/test/nativeSetup.ts'] } }),
          },
        ],
        test: { name: 'native', include: ['src/**/*.native.test.tsx'], sequence: { setupFiles: 'list' } },
      },
    ],
    pool: 'threads',
    maxWorkers: '50%',
  },
});
