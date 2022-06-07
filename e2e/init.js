/* eslint-disable no-undef */
// eslint-disable-next-line import/no-commonjs
require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  await device.clearKeychain();

  await device.launchApp();

  await device.setURLBlacklist([
    '.*api.thegraph.com.*',
    '.*raw.githubusercontent.com.*',
    '.*api.coingecko.com.*',
    '.*rainbow.imgix.net.*',
    '.*infura.io.*',
  ]);
});
