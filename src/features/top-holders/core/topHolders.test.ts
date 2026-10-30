import { describe, expect, it } from 'vitest';

import { isHolderWalletFilter, rankHolding, rankRealized, rankUnrealized, type TokenHolder, type TokenTrader } from './topHolders';

const FILTER = { categories: ['NORMIE'], excludedLabels: ['BRIDGE'] };
const NOTHING_SOLD = { tokenAmountSold1y: '0', amountSoldUsd1y: '0', realizedProfitUsd1y: '0', lastTransactionAt: 0 };

function holder(address: string, balance: string, overrides: Partial<TokenHolder> = {}): TokenHolder {
  return { address, balance, category: 'NORMIE', identityLabels: [], ...overrides };
}

function trader(address: string, overrides: Partial<TokenTrader>): TokenTrader {
  return { address, purchasedTokenBalance: '0', tokenAcquisitionCostUsd: '0', tokenBalanceLive: '0', ...NOTHING_SOLD, ...overrides };
}

function bought(address: string, purchasedTokenBalance: string, tokenAcquisitionCostUsd: string, tokenBalanceLive = purchasedTokenBalance) {
  return trader(address, { purchasedTokenBalance, tokenAcquisitionCostUsd, tokenBalanceLive });
}

describe('rankHolding', () => {
  it('lists real users by balance with their value, share of supply, and trades when they traded', () => {
    const midTrades = bought('mid', '50', '25');
    const rows = rankHolding(
      {
        holders: [
          holder('exchange', '1000', { category: 'EXCHANGE' }),
          holder('whale', '100'),
          holder('bridge', '90', { identityLabels: ['BRIDGE'] }),
          holder('uncategorized', '80', { category: null }),
          holder('mid', '50'),
        ],
        priceUsd: '2',
        totalSupply: '2000',
        traders: [bought('exchange', '1000', '500'), midTrades],
      },
      FILTER
    );

    expect(rows).toEqual([
      { address: 'whale', valueUsd: '200', supplyPercentage: '5', trades: undefined },
      { address: 'mid', valueUsd: '100', supplyPercentage: '2.5', trades: midTrades },
    ]);
  });

  it('caps the list at ten holders and reads a missing supply as 0%', () => {
    const holders = Array.from({ length: 12 }, (_, index) => holder(`0x${index}`, String(100 - index)));
    const rows = rankHolding({ holders, priceUsd: '2', totalSupply: '0', traders: [] }, FILTER);

    expect(rows).toHaveLength(10);
    expect(rows[0].supplyPercentage).toBe('0');
  });
});

describe('rankUnrealized', () => {
  it('ranks positions worth $1 or more by P&L in USD on the live balance, losses last', () => {
    const mid = bought('mid', '100', '20');
    const rows = rankUnrealized(
      [
        // Largest position, smallest gain
        bought('whale', '1000', '990'),
        // Largest percentage gain
        bought('degen', '10', '1'),
        // Largest P&L in USD
        mid,
        // Sent half away: only the 50 still held count, at half the cost
        bought('sender', '100', '40', '50'),
        bought('underwater', '50', '100'),
        // Codex's balance filter lags: sold out since
        bought('exited', '100', '1', '0'),
        // Worth under $1: a near-zero loss that would otherwise rank above real losses
        bought('dust', '0.5', '0.6'),
        bought('dollar', '1', '1.5'),
      ],
      '1'
    );

    expect(rows.map(row => [row.address, row.pnl.amount])).toEqual([
      ['mid', '80'],
      ['sender', '30'],
      ['whale', '10'],
      ['degen', '9'],
      ['dollar', '-0.5'],
      ['underwater', '-50'],
    ]);
    expect(rows[0].avgEntryUsd).toBe('0.2');
    expect(rows[0].trades).toBe(mid);
  });

  it('keeps the ten best of more traders, in any input order', () => {
    // P&L grows with the index: 0x0 makes $1, 0x11 makes $12
    const traders = Array.from({ length: 12 }, (_, index) => bought(`0x${index}`, String(index + 2), '1'));
    const rows = rankUnrealized(traders, '1');

    expect(rows).toHaveLength(10);
    expect(rows[0].address).toBe('0x11');
  });
});

describe('rankRealized', () => {
  it("keeps Codex's ranking and relates profit to the cost of the tokens sold", () => {
    const sold = (address: string, amountSoldUsd1y: string, realizedProfitUsd1y: string) =>
      trader(address, { tokenAmountSold1y: '1', amountSoldUsd1y, realizedProfitUsd1y });
    const first = sold('first', '10', '5');
    const rows = rankRealized([first, sold('second', '150', '50'), sold('gifted', '20', '20')]);

    expect(rows.map(row => [row.address, row.realized.amount, row.realized.percentage])).toEqual([
      ['first', '5', '100'],
      ['second', '50', '50'],
      ['gifted', '20', null],
    ]);
    expect(rows[0].trades).toBe(first);
  });
});

describe('isHolderWalletFilter', () => {
  it.each([
    [{ categories: ['NORMIE'], excludedLabels: [] }, true],
    [{ categories: ['NORMIE'] }, false],
    [{ categories: 'NORMIE', excludedLabels: [] }, false],
    [{ categories: ['NORMIE'], excludedLabels: [1] }, false],
    [null, false],
    ['NORMIE', false],
  ])('accepts %j: %s', (value, expected) => {
    expect(isHolderWalletFilter(value)).toBe(expected);
  });
});
