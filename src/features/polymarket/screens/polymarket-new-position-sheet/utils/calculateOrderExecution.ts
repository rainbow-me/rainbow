import { OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import {
  divWorklet,
  greaterThanOrEqualToWorklet,
  greaterThanWorklet,
  maxWorklet,
  mulWorklet,
  subWorklet,
  sumWorklet,
} from '@/safe-math/SafeMath';
import { USD_FEE_PER_TOKEN } from '@/features/polymarket/constants';

export type OrderExecution = {
  averagePrice: string;
  worstPrice: string;
  fee: string;
  tokensBought: string;
  hasInsufficientLiquidity: boolean;
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
  const spread = subWorklet(bestAskPrice, bestBidPrice);

  const minBuyAmountUsd = maxWorklet(orderBook?.min_order_size ?? '1', '1');

  return {
    averagePrice,
    worstPrice,
    bestPrice: bestAskPrice,
    fee,
    tokensBought,
    hasInsufficientLiquidity,
    spread,
    minBuyAmountUsd: String(minBuyAmountUsd),
  };
}
