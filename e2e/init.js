/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
// eslint-disable-next-line import/no-commonjs
require('dotenv').config({ path: '.env' });

beforeAll(async () => {
  await device.launchApp();

  await device.setURLBlacklist([
    // eslint-disable-next-line prettier/prettier
    'api.thegraph.com\/subgraphs\/name\/ianlapham\/uniswapv2',
    'raw.githubusercontent.com',
  ]);
});
