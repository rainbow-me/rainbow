/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'ts-jest',
    '^.+\\.js$': 'ts-jest',
  },
  testEnvironment: 'node',
  testTimeout: 120_000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  moduleNameMapper: {
    '^@/__swaps__/(.*)$': '<rootDir>/../src/__swaps__/$1',
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  setupFiles: ['dotenv/config'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(-.*)?|@react-native(-community)?|@react-navigation/(.*)|react-query|react-navigation))',
  ],
};
