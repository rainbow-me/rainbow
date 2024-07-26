/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig');

module.exports = {
  cache: false, // Disable cache to ensure accurate results on reruns
  setupFilesAfterEnv: ['./init.js'],
  testEnvironment: './environment',

  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],

  testTimeout: 300_000,
  testRegex: '\\.spec\\.[jt]sx?$',
  verbose: false,
  transform: {
    '\\.[jt]sx?$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '../',
  }),
  setupFiles: ['dotenv/config'],
};
