/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'react-native',
  setupFiles: ['./config/test/jest-setup.js'],
  testPathIgnorePatterns: ['node_modules', 'e2e'],
  transform: {
    // https://kulshekhar.github.io/ts-jest/docs/guides/react-native
    '\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-keyboard-area|@react-native(-community)?)/)',
  ],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
};
