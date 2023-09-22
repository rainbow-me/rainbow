/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig');

module.exports = {
  maxWorkers: 1,
  setupFilesAfterEnv: ['./init.js'],
  testEnvironment: './environment',

  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],

  testTimeout: 240000,
  testRegex: '\\.spec\\.[jt]sx?$',
  verbose: true,
  transform: {
    '\\.[jt]sx?$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '../',
  }),
  setupFiles: ['dotenv/config'],
};
