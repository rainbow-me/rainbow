/* eslint-disable @typescript-eslint/no-var-requires */
import { exec } from 'child_process';
import { device } from 'detox';

require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  if (device.getPlatform() === 'android') {
    // connecting to metro
    await device.reverseTcpPort(8081);
    // connecting to hardhat
    await device.reverseTcpPort(8545); // TODO: WIP for android connecting in dev

    // make sure we don't have gesture navigation what might cause collisions
    exec('yarn adb-all shell cmd overlay enable com.android.internal.systemui.navbar.threebutton');
  }
  await device.clearKeychain();
  await device.launchApp({ newInstance: true, delete: true });
  await device.setURLBlacklist([
    '.*api.thegraph.com.*',
    '.*gateway-arbitrum.network.thegraph.com.*',
    '.*raw.githubusercontent.com.*',
    '.*api.coingecko.com.*',
    '.*rainbow.imgix.net.*',
    '.*infura.io.*',
    '.*rainbow.me.*',
    '.*rainbowjiumask.dataplane.rudderstack.com*',
    '.*rainbowme-res.cloudinary.com*',
    '.*rainbow-proxy-rpc.rainbowdotme.workers.*',
    '.*localhost:8081/assets/src/assets*.',
    '.*arc-graphql.rainbowdotme.workers.dev*.',
    '.*googleapis.com*.',
  ]);
});
