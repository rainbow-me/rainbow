import { type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { calculateFillFeesUsd, EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { calculateOrderBookSpread, getBestOrderBookPrice, simulateMarketFills } from '@/features/polymarket/utils/orderBookFills';
import { calculatePolymarketManualFeeUsd } from '@/features/polymarket/utils/polymarketManualFee';
import { greaterThanWorklet } from '@/framework/core/safeMath';

export type SellExecution = {
  averagePrice: string;
  worstPrice: string;
  bestPrice: string;
  fee: string;
  rainbowFee: string;
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
      rainbowFee: '0',
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
  const providerFee = calculateFillFeesUsd({ feeInfo: effectiveFeeInfo, fills: execution.fills });
  const rainbowFee = Number(calculatePolymarketManualFeeUsd(execution.totalShares));
  const fee = providerFee + rainbowFee;
  const grossProceedsUsd = String(execution.totalNotionalUsd);
  const expectedPayoutUsd = String(execution.totalNotionalUsd - fee);
  const tokensSold = String(execution.totalShares);
  const averagePrice = execution.totalShares > 0 ? String(execution.totalNotionalUsd / execution.totalShares) : '0';

  const bestBidPrice = getBestOrderBookPrice(orderBook.bids);
  const hasNoLiquidityAtMarketPrice = !greaterThanWorklet(bestBidPrice, '0');
  const spread = calculateOrderBookSpread({ asks: orderBook.asks, bids: orderBook.bids });

  return {
    averagePrice,
    worstPrice: String(execution.worstPrice),
    bestPrice: bestBidPrice,
    fee: String(fee),
    rainbowFee: String(rainbowFee),
    tokensSold,
    grossProceedsUsd,
    expectedPayoutUsd,
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    hasNoLiquidityAtMarketPrice,
    spread,
  };
}
