import { describe, expect, it } from 'vitest';

import { calculateSpotPnl, summarizeSpotPnlView, type SpotPnlViewSummary, type TokenTrades } from './spotPnl';

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
        unrealizedPnlUsd: '20',
        realizedPnlUsd: null,
      },
    },
    {
      name: 'partially realized, excluding received tokens and converting to the native currency',
      trades: {
        purchasedTokenBalance: '10',
        tokenAcquisitionCostUsd: '100',
        tokenAmountSold1y: '5',
        amountSoldUsd1y: '70',
        realizedProfitUsd1y: '-30',
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
        realized: { amount: '-60', percentage: '-30' },
        total: { amount: '40', percentage: '10' },
        unrealizedPnlUsd: '50',
        realizedPnlUsd: '-30',
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
        unrealizedPnlUsd: null,
        realizedPnlUsd: '-20',
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
        unrealizedPnlUsd: null,
        realizedPnlUsd: '-20',
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

describe('summarizeSpotPnlView', () => {
  const held = { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100' };
  const pnlOf = (trades: TokenTrades, price: string) => calculateSpotPnl({ trades, balance: '10', price, usdToNativeRate: 2 });

  it.each<{ name: string; input: Parameters<typeof summarizeSpotPnlView>[0]; expected: SpotPnlViewSummary | null }>([
    {
      name: 'both amounts in USD for a partially realized position',
      input: {
        pnl: pnlOf({ ...held, tokenAmountSold1y: '5', amountSoldUsd1y: '70', realizedProfitUsd1y: '-30', lastTransactionAt: 0 }, '30'),
        lastTradeAt: 1700000000,
        isLoaded: true,
        price: '30',
      },
      expected: { variant: 'partiallyRealized', unrealizedPnlUsd: 50, realizedPnlUsd: -30, lastTradeAt: 1700000000 },
    },
    {
      name: 'a zero amount, not null, for a break-even position',
      input: { pnl: pnlOf({ ...held, ...NOTHING_SOLD }, '20'), lastTradeAt: 1700000000, isLoaded: true, price: '20' },
      expected: { variant: 'unrealized', unrealizedPnlUsd: 0, realizedPnlUsd: null, lastTradeAt: 1700000000 },
    },
    {
      name: 'nulls when the loaded trades leave nothing to show',
      input: { pnl: null, lastTradeAt: 1700000000, isLoaded: true, price: '1' },
      expected: { variant: null, unrealizedPnlUsd: null, realizedPnlUsd: null, lastTradeAt: null },
    },
    {
      name: 'nothing while the trades failed to load',
      input: { pnl: null, lastTradeAt: undefined, isLoaded: false, price: '1' },
      expected: null,
    },
    {
      name: 'nothing while the price is missing',
      input: { pnl: null, lastTradeAt: 1700000000, isLoaded: true, price: '0' },
      expected: null,
    },
  ])('$name', ({ input, expected }) => {
    expect(summarizeSpotPnlView(input)).toEqual(expected);
  });
});
