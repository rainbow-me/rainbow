/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'react-native',
  setupFiles: ['./config/test/jest-setup.js'],
  testPathIgnorePatterns: ['node_modules', 'e2e'],
  transform: {
    '\\.tsx?$': 'ts-jest',
    '\\.json?$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
};
