/* eslint-disable no-undef */

import detox from 'detox';
import adapter from 'detox/runners/jest/adapter';
const config = require('../package.json').detox;

jest.setTimeout(60000);
// eslint-disable-next-line jest/no-jasmine-globals
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config, { launchApp: false });
  await device.launchApp({ permissions: { camera: 'YES' } });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
