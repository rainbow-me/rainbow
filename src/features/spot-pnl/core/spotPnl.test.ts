import { describe, expect, it } from 'vitest';

import { calculateSpotPnl, type TokenTrades } from './spotPnl';

const NOTHING_SOLD = { tokenAmountSold1y: '0', amountSoldUsd1y: '0', realizedProfitUsd1y: '0', lastTransactionAt: 0 };

describe('calculateSpotPnl', () => {
  it.each<{
    name: string;
    trades: TokenTrades;
    balance: string;
    price: string;
    rate: number;
    expected: ReturnType<typeof calculateSpotPnl>;
  }>([
    {
      name: 'unrealized when nothing was sold',
      trades: { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100', ...NOTHING_SOLD },
      balance: '10',
      price: '12',
      rate: 1,
      expected: {
        variant: 'unrealized',
        position: { heldBalance: '10', cost: '100', value: '120', amount: '20', percentage: '20' },
        invested: '100',
        avgEntry: '10',
        current: '12',
        excludedBalance: '0',
        headlineUsd: '20',
      },
    },
    {
      name: 'partially realized, excluding received tokens and converting to the native currency',
      trades: {
        purchasedTokenBalance: '10',
        tokenAcquisitionCostUsd: '100',
        tokenAmountSold1y: '5',
        amountSoldUsd1y: '60',
        realizedProfitUsd1y: '10',
        lastTransactionAt: 0,
      },
      balance: '12',
      price: '30',
      rate: 2,
      expected: {
        variant: 'partiallyRealized',
        position: { heldBalance: '10', cost: '200', value: '300', amount: '100', percentage: '50' },
        invested: '200',
        avgEntry: '20',
        current: '30',
        excludedBalance: '2',
        realized: { amount: '20', percentage: '20' },
        total: { amount: '120', percentage: '40' },
        headlineUsd: '60',
      },
    },
    {
      name: 'realized when nothing purchased is held',
      trades: {
        purchasedTokenBalance: '0',
        tokenAcquisitionCostUsd: '0',
        tokenAmountSold1y: '4',
        amountSoldUsd1y: '60',
        realizedProfitUsd1y: '-20',
        lastTransactionAt: 0,
      },
      balance: '3',
      price: '15',
      rate: 1,
      expected: {
        variant: 'fullyRealized',
        invested: '80',
        avgEntry: '20',
        avgExit: '15',
        realized: { amount: '-20', percentage: '-25' },
        excludedBalance: '3',
        headlineUsd: '-20',
      },
    },
    {
      name: 'realized when everything purchased was sold',
      trades: {
        purchasedTokenBalance: '4',
        tokenAcquisitionCostUsd: '80',
        tokenAmountSold1y: '4',
        amountSoldUsd1y: '60',
        realizedProfitUsd1y: '-20',
        lastTransactionAt: 0,
      },
      balance: '0',
      price: '30',
      rate: 2,
      expected: {
        variant: 'fullyRealized',
        invested: '160',
        avgEntry: '40',
        avgExit: '30',
        realized: { amount: '-40', percentage: '-25' },
        excludedBalance: '0',
        headlineUsd: '-20',
      },
    },
    {
      name: 'nothing when nothing is held or sold',
      trades: { purchasedTokenBalance: '0', tokenAcquisitionCostUsd: '0', ...NOTHING_SOLD },
      balance: '5',
      price: '1',
      rate: 1,
      expected: null,
    },
  ])('$name', ({ trades, balance, price, rate, expected }) => {
    expect(calculateSpotPnl({ trades, balance, price, usdToNativeRate: rate })).toEqual(expected);
  });
});
