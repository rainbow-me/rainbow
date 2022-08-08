/* eslint-disable no-undef */
// eslint-disable-next-line import/no-commonjs
require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  await device.reverseTcpPort(8081); //TODO: WIP for android connecting in dev
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
