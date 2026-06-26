import { adjustBuyAmountForFees } from '@polymarket/clob-client-v2';

import { type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';

import { calculateBuyOrderExecution } from './calculateBuyOrderExecution';

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
}));

jest.mock('@polymarket/clob-client-v2', () => {
  const actual = jest.requireActual<typeof import('@polymarket/clob-client-v2')>('@polymarket/clob-client-v2');
  return { ...actual, adjustBuyAmountForFees: jest.fn(actual.adjustBuyAmountForFees) };
});

const mockAdjustBuyAmountForFees = jest.mocked(adjustBuyAmountForFees);

describe('calculateBuyOrderExecution', () => {
  beforeEach(() => {
    mockAdjustBuyAmountForFees.mockClear();
  });

  it('keeps SDK provider fees and trade fees inside the user buy cap', () => {
    const platformFeeRate = 0.02;

    const execution = calculateBuyOrderExecution({
      buyAmountUsd: '10',
      feeInfo: {
        minimumOrderSize: 1,
        platformFeeExponent: 0,
        platformFeeRate,
      },
      orderBook: createOrderBook({
        asks: [
          { price: '0.8', size: '100' },
          { price: '0.5', size: '5' },
        ],
        bids: [{ price: '0.49', size: '100' }],
      }),
    });

    expect(execution.isQuoteReady).toBe(true);
    const totalSpendUsd = Number(execution.tokensBought) * Number(execution.averagePrice) + Number(execution.fee);

    expect(totalSpendUsd).toBeLessThanOrEqual(10.000001);
    expect(10 - totalSpendUsd).toBeLessThan(0.00001);
    expect(Number(execution.orderSpendCap)).toBeLessThan(10);
    expect(execution.worstPrice).toBe('0.8');
    expect(Number(execution.fee)).toBeCloseTo(Number(execution.rainbowFee) + Number(execution.tokensBought) * platformFeeRate, 9);
    expect(execution.minBuyAmountUsd).toBe('1.07');
    expect(mockAdjustBuyAmountForFees).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      platformFeeRate,
      0,
      0
    );
  });

  it('does not quote a buy before market fee info is ready', () => {
    const execution = calculateBuyOrderExecution({
      buyAmountUsd: '10',
      feeInfo: null,
      orderBook: createOrderBook({
        asks: [{ price: '0.8', size: '100' }],
        bids: [{ price: '0.79', size: '100' }],
      }),
    });

    expect(execution.isQuoteReady).toBe(false);
    expect(execution.orderSpendCap).toBe('0');
    expect(mockAdjustBuyAmountForFees).not.toHaveBeenCalled();
  });

  it('does not mark a zero-spend buy quote ready', () => {
    const execution = calculateBuyOrderExecution({
      buyAmountUsd: '0.0000001',
      feeInfo: {
        minimumOrderSize: 1,
        platformFeeExponent: 0,
        platformFeeRate: 0.02,
      },
      orderBook: createOrderBook({
        asks: [{ price: '0.8', size: '100' }],
        bids: [{ price: '0.79', size: '100' }],
      }),
    });

    expect(execution.orderSpendCap).toBe('0');
    expect(execution.tokensBought).toBe('0');
    expect(execution.isQuoteReady).toBe(false);
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
