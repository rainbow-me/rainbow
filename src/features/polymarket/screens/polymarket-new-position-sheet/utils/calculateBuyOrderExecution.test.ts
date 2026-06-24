import { adjustBuyAmountForFees } from '@polymarket/clob-client-v2';

import { type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';

import { calculateBuyOrderExecution } from './calculateBuyOrderExecution';

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
  POLYMARKET_RAINBOW_FEE_USD_PER_TOKEN: '0.01',
}));

jest.mock('@polymarket/clob-client-v2', () => ({
  adjustBuyAmountForFees: jest.fn((amount: number) => amount),
}));

const mockAdjustBuyAmountForFees = jest.mocked(adjustBuyAmountForFees);

describe('calculateBuyOrderExecution', () => {
  beforeEach(() => {
    mockAdjustBuyAmountForFees.mockClear();
  });

  it('reserves the manual fee inside the user buy cap', () => {
    const execution = calculateBuyOrderExecution({
      buyAmountUsd: '10',
      feeInfo: {
        minimumOrderSize: 1,
        platformFeeExponent: 0,
        platformFeeRate: 0,
      },
      orderBook: createOrderBook({
        asks: [{ price: '0.5', size: '100' }],
        bids: [{ price: '0.49', size: '100' }],
      }),
    });

    expect(Number(execution.orderSpendCap) + Number(execution.rainbowFee)).toBeLessThanOrEqual(10.000001);
    expect(Number(execution.tokensBought)).toBeCloseTo(19.6078, 3);
    expect(Number(execution.rainbowFee)).toBeCloseTo(0.196078, 6);
    expect(execution.fee).toBe(execution.rainbowFee);
    expect(execution.minBuyAmountUsd).toBe('1.02');
    expect(mockAdjustBuyAmountForFees).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0, 0, 0);
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
