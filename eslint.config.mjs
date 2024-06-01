import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import { parse } from 'ast-parser';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import babelParser from '@babel/eslint-parser';

// Polyfill for structuredClone
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = value => JSON.parse(JSON.stringify(value));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalVars = {
  __DEV__: true,
  module: 'readonly',
  require: 'readonly',
  global: 'readonly',
  jest: 'readonly',
  process: 'readonly',
  __dirname: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  localStorage: 'readonly',
  window: 'readonly',
};

  const data = fs.readFileSync(path.resolve(__dirname, './globalVariables.js'), 'utf8');
  const parsedData = babelParse(data, { sourceType: 'module' });
  const exportDefaultDeclaration = parsedData.program.body.find(e => e.type === 'ExportDefaultDeclaration');

  if (exportDefaultDeclaration && exportDefaultDeclaration.declaration && exportDefaultDeclaration.declaration.properties) {
    globalVars = exportDefaultDeclaration.declaration.properties
      .map(e => e.key.name)
      .reduce((acc, variable) => {
        acc[variable] = true;
        return acc;
      }, globalVars);
  } else {
    console.error('ExportDefaultDeclaration or its properties are undefined.');
  }

export default [
  js.configs.recommended,
  {
    ignores: [
      'src/react-native-animated-charts/node_modules/*',
      'src/react-native-animated-charts/Example/node_modules/*',
      'src/react-native-animated-charts/Example/*',
      'patches/reanimated/*',
      'ios/*',
      'android/*',
      'node_modules/*',
      './node_modules/**',
      '**/node_modules/*',
      'coverage-ts/**',
      'out/',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      '.detoxrc.js',
      '__generated__',
      'coverage',
      'src/browser',
      'src/__swaps__/README.md',
      'InjectedJSBundle.js',
      'eslint.config.mjs',
      'src/graphql/config.js',
    ],
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      globals: globalVars,
    },
    plugins: {
      react,
      import: importPlugin,
      jest,
    },
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@react-navigation/core'],
              message: 'You probably want to use @/navigation instead, to ensure that all of our customizations are applied.',
            },
          ],
        },
      ],
      'jest/expect-expect': 'off',
      'jest/no-disabled-tests': 'off',
      'import/no-commonjs': 'off',
      'import/no-cycle': 'off',
    },
  },
];
