import { type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';

import { calculateSellExecution } from './calculateSellExecution';

jest.mock('@/features/polymarket/constants', () => ({
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

    expect(execution.grossProceedsUsd).toBe('4');
    expect(execution.rainbowFee).toBe('0.112');
    expect(Number(execution.fee)).toBeCloseTo(0.212, 12);
    expect(Number(execution.expectedPayoutUsd)).toBeCloseTo(3.788, 12);
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
