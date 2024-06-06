/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig');

module.exports = {
  rootDir: '../', // Explicitly set rootDir to the project root
  setupFilesAfterEnv: ['./e2e/init.js'],
  testEnvironment: './e2e/environment',

  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],

  testTimeout: 300_000,
  testRegex: '\\.spec\\.[jt]sx?$',
  verbose: false,
  transform: {
    '\\.[jt]sx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-keyboard-area|imgix-core-js|react-native-payments|@react-native-firebase|@react-native(-community)?)/)',
  ],

  // trying to figure out how to resolve the modules correctly. i think this setup does it.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/__swaps__/screens/Swap/providers/getNonceAndPerformSwap$':
      '<rootDir>/src/__swaps__/screens/Swap/providers/getNonceAndPerformSwap.ts',
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  },
  setupFiles: ['dotenv/config'],
};
