/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'react-native',
  setupFiles: ['./config/test/jest-setup.js'],
  testPathIgnorePatterns: ['node_modules', 'e2e'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  transform: {
    // https://kulshekhar.github.io/ts-jest/docs/28.0/guides/react-native
    '\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-keyboard-area|imgix-core-js|react-native-payments|@react-native-firebase|@react-native(-community)?)/)',
  ],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
};
