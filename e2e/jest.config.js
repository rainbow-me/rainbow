const baseConfig = require('../jest.config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/**/*.spec.ts'],
};
