import { describe, expect, it } from 'vitest';

import { rankTopHolders, type TokenHolder } from './topHolders';

const FILTER = { categories: ['NORMIE'], excludedLabels: ['BRIDGE'] };
const NOTHING_SOLD = { tokenAmountSold1y: '0', amountSoldUsd1y: '0', realizedProfitUsd1y: '0', lastTransactionAt: 0 };

function holder(address: string, balance: string, overrides: Partial<TokenHolder> = {}): TokenHolder {
  return { address, balance, category: 'NORMIE', identityLabels: [], trades: null, ...overrides };
}

function bought(purchasedTokenBalance: string, tokenAcquisitionCostUsd: string) {
  return { purchasedTokenBalance, tokenAcquisitionCostUsd, ...NOTHING_SOLD };
}

describe('rankTopHolders', () => {
  it('lists real users by balance and ranks the ones with a cost basis by unrealized P&L in the native currency', () => {
    const { byStake, byProfit } = rankTopHolders({
      data: {
        // Ordered by balance, as Codex returns them; $2 at a 0.5 rate makes each token worth 1 in the native currency
        holders: [
          holder('exchange', '1000', { category: 'EXCHANGE', trades: bought('1000', '1') }),
          holder('whale', '100', { trades: bought('100', '100') }),
          holder('bridge', '90', { identityLabels: ['BRIDGE'], trades: bought('90', '1') }),
          holder('uncategorized', '80', { category: null, trades: bought('80', '1') }),
          holder('airdropped', '60'),
          holder('degen', '10', { trades: bought('10', '1') }),
          holder('underwater', '5', { trades: bought('5', '20') }),
        ],
        priceUsd: '2',
        totalSupply: '2000',
      },
      filter: FILTER,
      usdToNativeRate: 0.5,
    });

    expect(byStake.map(row => [row.holder.address, row.value, row.supplyPercentage])).toEqual([
      ['whale', '100', '5'],
      ['airdropped', '60', '3'],
      ['degen', '10', '0.5'],
      ['underwater', '5', '0.25'],
    ]);
    // degen is up 1900% but whale's gain of 50 is larger
    expect(byProfit.map(row => [row.holder.address, row.value, row.pnl.amount])).toEqual([
      ['whale', '100', '50'],
      ['degen', '10', '9.5'],
      ['underwater', '5', '-5'],
    ]);
  });

  it('caps each list at ten holders', () => {
    const holders = Array.from({ length: 12 }, (_, index) => holder(`0x${index}`, String(100 - index), { trades: bought('1', '1') }));
    const { byStake, byProfit } = rankTopHolders({
      data: { holders, priceUsd: '1', totalSupply: '0' },
      filter: FILTER,
      usdToNativeRate: 1,
    });

    expect(byStake).toHaveLength(10);
    expect(byStake[0].supplyPercentage).toBe('0');
    expect(byProfit).toHaveLength(10);
  });
});
