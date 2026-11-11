import { describe, expect, it, vi } from 'vitest';

import { type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';

import { calculateSellExecution } from './calculateSellExecution';

vi.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
}));

describe('calculateSellExecution', () => {
  it('subtracts provider and trade fees from expected sell payout', () => {
    const execution = calculateSellExecution({
      feeInfo: {
        minimumOrderSize: 1,
        platformFeeExponent: 0,
        platformFeeRate: 0.02,
      },
      orderBook: createOrderBook({
        asks: [{ price: '0.81', size: '10' }],
        bids: [{ price: '0.8', size: '10' }],
      }),
      sellAmountTokens: '5',
    });

    expect(execution.isQuoteReady).toBe(true);
    expect(execution.grossProceedsUsd).toBe('4');
    expect(execution.rainbowFee).toBe('0.112');
    expect(execution.fee).toBe('0.212');
    expect(execution.expectedPayoutUsd).toBe('3.788');
  });

  it('quotes platform fees at Polymarket settlement precision', () => {
    const execution = calculateSellExecution({
      feeInfo: {
        minimumOrderSize: 1,
        platformFeeExponent: 1,
        platformFeeRate: 0.05,
      },
      orderBook: createOrderBook({
        asks: [{ price: '0.77', size: '10' }],
        bids: [{ price: '0.76', size: '10' }],
      }),
      sellAmountTokens: '1.27',
    });

    expect(execution.grossProceedsUsd).toBe('0.9652');
    expect(execution.rainbowFee).toBe('0.028956');
    expect(execution.fee).toBe('0.040536');
    expect(execution.expectedPayoutUsd).toBe('0.924664');
  });

  it('does not quote a sell before market fee info is ready', () => {
    const execution = calculateSellExecution({
      feeInfo: null,
      orderBook: createOrderBook({
        asks: [{ price: '0.81', size: '10' }],
        bids: [{ price: '0.8', size: '10' }],
      }),
      sellAmountTokens: '5',
    });

    expect(execution.isQuoteReady).toBe(false);
    expect(execution.expectedPayoutUsd).toBe('0');
  });
});

function createOrderBook({ asks, bids }: { asks: OrderBook['asks']; bids: OrderBook['bids'] }): OrderBook {
  return {
    market: 'market',
    asset_id: 'asset',
    timestamp: '',
    hash: 'hash',
    bids,
    asks,
    min_order_size: '1',
    tick_size: '0.01',
    neg_risk: false,
  };
}
