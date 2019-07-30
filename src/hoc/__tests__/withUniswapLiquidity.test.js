import { transformPool } from '../withUniswapLiquidity';

test('transformPool', async () => {
  const pool = {
    balance: '1',
    ethBalance: '1.12',
    token: {
      balance: '200',
      decimals: 18,
      symbol: 'HELLO',
    },
    totalSupply: '6000',
  };
  const balancePriceUnit = '1.01';
  const result = transformPool(pool, balancePriceUnit, 'USD');
  expect(result).toHaveProperty('ethBalance', 1.12);
  expect(result).toHaveProperty('nativeDisplay');
});
