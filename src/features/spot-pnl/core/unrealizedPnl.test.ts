import { describe, expect, it } from 'vitest';

import { calculateUnrealizedPnl } from './unrealizedPnl';

describe('calculateUnrealizedPnl', () => {
  it.each([
    {
      name: 'all purchased and still held',
      purchased: '10',
      cost: '100',
      balance: '10',
      price: '12',
      rate: 1,
      expected: { heldBalance: '10', cost: '100', value: '120', amount: '20', percentage: '20' },
    },
    {
      name: 'sent out tokens are not counted',
      purchased: '10',
      cost: '100',
      balance: '4',
      price: '8',
      rate: 1,
      expected: { heldBalance: '4', cost: '40', value: '32', amount: '-8', percentage: '-20' },
    },
    {
      name: 'received tokens are not counted',
      purchased: '4',
      cost: '40',
      balance: '9',
      price: '12',
      rate: 1,
      expected: { heldBalance: '4', cost: '40', value: '48', amount: '8', percentage: '20' },
    },
    {
      name: 'cost is converted to the native currency',
      purchased: '10',
      cost: '100',
      balance: '10',
      price: '18',
      rate: 1.5,
      expected: { heldBalance: '10', cost: '150', value: '180', amount: '30', percentage: '20' },
    },
  ])('$name', ({ purchased, cost, balance, price, rate, expected }) => {
    expect(
      calculateUnrealizedPnl({
        acquisition: { purchasedTokenBalance: purchased, tokenAcquisitionCostUsd: cost },
        balance,
        price,
        usdToNativeRate: rate,
      })
    ).toEqual(expected);
  });

  it.each([
    { name: 'nothing was purchased', purchased: '0', cost: '0', balance: '5', price: '1' },
    { name: 'nothing is held', purchased: '10', cost: '100', balance: '0', price: '1' },
    { name: 'purchases had no cost', purchased: '10', cost: '0', balance: '10', price: '1' },
    { name: 'the token has no price', purchased: '10', cost: '100', balance: '10', price: '0' },
  ])('has no P&L when $name', ({ purchased, cost, balance, price }) => {
    expect(
      calculateUnrealizedPnl({
        acquisition: { purchasedTokenBalance: purchased, tokenAcquisitionCostUsd: cost },
        balance,
        price,
        usdToNativeRate: 1,
      })
    ).toBeNull();
  });
});
