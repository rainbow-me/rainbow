/* eslint-disable no-undef */
// eslint-disable-next-line import/no-commonjs
require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  if (device.getPlatform() === 'android') {
    // connecting to metro
    await device.reverseTcpPort(8081);
    // connecting to hardhat
    await device.reverseTcpPort(8545); //TODO: WIP for android connecting in dev
  }
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
