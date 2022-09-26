/* eslint-disable no-undef */
// eslint-disable-next-line import/no-commonjs
import { exec } from 'child_process';

require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  if (device.getPlatform() === 'android') {
    // connecting to metro
    await device.reverseTcpPort(8081);
    // connecting to hardhat
    await device.reverseTcpPort(8545); //TODO: WIP for android connecting in dev

    // make sure we don't have gesture navigation what might cause collisions
    await exec(
      'yarn adb-all shell cmd overlay enable com.android.internal.systemui.navbar.threebutton'
    );
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
