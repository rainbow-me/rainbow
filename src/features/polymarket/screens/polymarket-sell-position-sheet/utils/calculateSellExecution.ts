import { type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import {
  calculateFillFeesUsd,
  EMPTY_POLYMARKET_FEE_INFO,
  getBestOrderBookPrice,
  simulateMarketFills,
  type PolymarketFeeInfo,
} from '@/features/polymarket/utils/orderExecution';
import { greaterThanWorklet, subWorklet } from '@/framework/core/safeMath';

export type SellExecution = {
  averagePrice: string;
  worstPrice: string;
  bestPrice: string;
  fee: string;
  tokensSold: string;
  grossProceedsUsd: string;
  expectedPayoutUsd: string;
  hasInsufficientLiquidity: boolean;
  hasNoLiquidityAtMarketPrice: boolean;
  spread: string;
};

export function calculateSellExecution({
  feeInfo,
  orderBook,
  sellAmountTokens,
}: {
  feeInfo?: PolymarketFeeInfo | null;
  orderBook: OrderBook | null;
  sellAmountTokens: string;
}): SellExecution {
  if (!orderBook) {
    return {
      averagePrice: '0',
      worstPrice: '0',
      bestPrice: '0',
      fee: '0',
      tokensSold: '0',
      grossProceedsUsd: '0',
      expectedPayoutUsd: '0',
      hasInsufficientLiquidity: false,
      hasNoLiquidityAtMarketPrice: false,
      spread: '0',
    };
  }

  const execution = simulateMarketFills({ levels: orderBook.bids, targetAmount: Number(sellAmountTokens), targetType: 'shares' });
  const effectiveFeeInfo = feeInfo ?? EMPTY_POLYMARKET_FEE_INFO;
  const fee = calculateFillFeesUsd({ feeInfo: effectiveFeeInfo, fills: execution.fills });
  const grossProceedsUsd = String(execution.totalNotionalUsd);
  const expectedPayoutUsd = String(execution.totalNotionalUsd - fee);
  const tokensSold = String(execution.totalShares);
  const averagePrice = execution.totalShares > 0 ? String(execution.totalNotionalUsd / execution.totalShares) : '0';

  const bestAskPrice = getBestOrderBookPrice(orderBook.asks);
  const bestBidPrice = getBestOrderBookPrice(orderBook.bids);
  const hasNoLiquidityAtMarketPrice = !greaterThanWorklet(bestBidPrice, '0');
  const spread =
    greaterThanWorklet(bestAskPrice, '0') && greaterThanWorklet(bestBidPrice, '0') ? subWorklet(bestAskPrice, bestBidPrice) : '0';

  return {
    averagePrice,
    worstPrice: String(execution.worstPrice),
    bestPrice: bestBidPrice,
    fee: String(fee),
    tokensSold,
    grossProceedsUsd,
    expectedPayoutUsd,
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    hasNoLiquidityAtMarketPrice,
    spread,
  };
}
