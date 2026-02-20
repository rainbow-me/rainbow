import { OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import {
  ceilWorklet,
  divWorklet,
  greaterThanOrEqualToWorklet,
  greaterThanWorklet,
  mulWorklet,
  subWorklet,
  sumWorklet,
} from '@/framework/core/safeMath';
import { USD_FEE_PER_TOKEN } from '@/features/polymarket/constants';

export type OrderExecution = {
  averagePrice: string;
  worstPrice: string;
  fee: string;
  tokensBought: string;
  hasInsufficientLiquidity: boolean;
  hasNoLiquidityAtMarketPrice: boolean;
  spread: string;
  minBuyAmountUsd: string;
  bestPrice: string;
};

export function calculateOrderExecution({
  orderBook,
  buyAmountUsd,
  feePerToken = USD_FEE_PER_TOKEN,
}: {
  orderBook: OrderBook | null;
  buyAmountUsd: string;
  feePerToken?: string;
}): OrderExecution {
  if (!orderBook) {
    return {
      averagePrice: '0',
      worstPrice: '0',
      fee: '0',
      tokensBought: '0',
      hasInsufficientLiquidity: false,
      hasNoLiquidityAtMarketPrice: false,
      spread: '0',
      minBuyAmountUsd: '0',
      bestPrice: '0',
    };
  }

  let remainingUsd = buyAmountUsd;
  let tokensBought = '0';
  let totalUsdSpentOnTokens = '0';
  let worstPrice = '0';

  for (let i = orderBook.asks.length - 1; i >= 0; i--) {
    const ask = orderBook.asks[i];
    const effectivePrice = sumWorklet(ask.price, feePerToken);
    const priceLevelTotalCostWithFees = mulWorklet(effectivePrice, ask.size);

    if (greaterThanOrEqualToWorklet(remainingUsd, priceLevelTotalCostWithFees)) {
      tokensBought = sumWorklet(tokensBought, ask.size);
      totalUsdSpentOnTokens = sumWorklet(totalUsdSpentOnTokens, mulWorklet(ask.price, ask.size));
      remainingUsd = subWorklet(remainingUsd, priceLevelTotalCostWithFees);
      worstPrice = ask.price;
    } else {
      const tokensToBuy = divWorklet(remainingUsd, effectivePrice);
      tokensBought = sumWorklet(tokensBought, tokensToBuy);
      totalUsdSpentOnTokens = sumWorklet(totalUsdSpentOnTokens, mulWorklet(ask.price, tokensToBuy));
      worstPrice = ask.price;
      remainingUsd = '0';
      break;
    }
  }

  const hasInsufficientLiquidity = greaterThanWorklet(remainingUsd, '0');
  const averagePrice = greaterThanWorklet(tokensBought, '0') ? divWorklet(totalUsdSpentOnTokens, tokensBought) : '0';
  const fee = mulWorklet(tokensBought, feePerToken);

  const bestAskPrice = orderBook.asks.at(-1)?.price ?? '0';
  const bestBidPrice = orderBook.bids.at(-1)?.price ?? '0';
  const hasNoLiquidityAtMarketPrice = !greaterThanWorklet(bestAskPrice, '0');
  const spread = subWorklet(bestAskPrice, bestBidPrice);

  // There is an orderBook.min_order_size, but in practice it is always $1
  const polymarketMinOrderSize = '1';
  const rawMinBuyAmountUsd = greaterThanWorklet(bestAskPrice, '0')
    ? mulWorklet(polymarketMinOrderSize, divWorklet(sumWorklet(bestAskPrice, feePerToken), bestAskPrice))
    : polymarketMinOrderSize;
  // Round up to nearest cent
  const minBuyAmountUsd = divWorklet(ceilWorklet(mulWorklet(rawMinBuyAmountUsd, '100')), '100');

  return {
    averagePrice,
    worstPrice,
    bestPrice: bestAskPrice,
    fee,
    tokensBought,
    hasInsufficientLiquidity,
    hasNoLiquidityAtMarketPrice,
    spread,
    minBuyAmountUsd: String(minBuyAmountUsd),
  };
}
