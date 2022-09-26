/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig');

module.exports = {
  maxWorkers: 4,
  setupFilesAfterEnv: ['./init.js'],
  testEnvironment: './environment',
  testTimeout: 240000,
  testRegex: '\\.spec\\.[jt]sx?$',
  reporters: ['detox/runners/jest/streamlineReporter'],
  verbose: true,
  transform: {
    '\\.[jt]sx?$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '../',
  }),
  setupFiles: ['dotenv/config'],
};
