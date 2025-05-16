/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'react-native',
  setupFiles: ['@shopify/react-native-skia/jestSetup.js', './config/test/jest-setup.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))(?<!\\.disabled)\\.[jt]sx?$',
  testPathIgnorePatterns: ['node_modules', 'e2e'],
  transform: {
    '\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|uuid|@ledgerhq|react-native-keyboard-area|imgix-core-js|react-native-payments|@react-native-firebase|@react-native(-community)?|react-native-reanimated|@shopify\/react-native-skia|react-native-linear-gradient|react-native-markdown-display)/)',
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>',
    }),
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
