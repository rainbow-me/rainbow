/* eslint-disable no-undef */
// eslint-disable-next-line import/no-commonjs
require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  await device.launchApp({
    launchArgs: {
      detoxURLBlacklistRegex:
        ' \\("https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2"\\)',
    },
  });
});
