/* eslint-disable no-undef */
import detox from 'detox';
import adapter from 'detox/runners/jest/adapter';
import specReporter from 'detox/runners/jest/specReporter';
import { detox as config } from '../package.json';

// eslint-disable-next-line import/no-commonjs
require('dotenv').config({ path: '.env' });

jest.retryTimes(1);
jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(specReporter);

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
