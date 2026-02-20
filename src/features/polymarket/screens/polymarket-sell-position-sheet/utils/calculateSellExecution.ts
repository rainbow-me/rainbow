import { OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { divWorklet, greaterThanOrEqualToWorklet, greaterThanWorklet, mulWorklet, subWorklet, sumWorklet } from '@/framework/core/safeMath';
import { USD_FEE_PER_TOKEN } from '@/features/polymarket/constants';

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
  orderBook,
  sellAmountTokens,
  feePerToken = USD_FEE_PER_TOKEN,
}: {
  orderBook: OrderBook | null;
  sellAmountTokens: string;
  feePerToken?: string;
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

  let remainingTokens = sellAmountTokens;
  let tokensSold = '0';
  let grossProceedsUsd = '0';
  let worstPrice = '0';

  for (let i = orderBook.bids.length - 1; i >= 0; i--) {
    const bid = orderBook.bids[i];

    if (greaterThanOrEqualToWorklet(remainingTokens, bid.size)) {
      tokensSold = sumWorklet(tokensSold, bid.size);
      grossProceedsUsd = sumWorklet(grossProceedsUsd, mulWorklet(bid.price, bid.size));
      remainingTokens = subWorklet(remainingTokens, bid.size);
      worstPrice = bid.price;
    } else {
      tokensSold = sumWorklet(tokensSold, remainingTokens);
      grossProceedsUsd = sumWorklet(grossProceedsUsd, mulWorklet(bid.price, remainingTokens));
      worstPrice = bid.price;
      remainingTokens = '0';
      break;
    }
  }

  const hasInsufficientLiquidity = greaterThanWorklet(remainingTokens, '0');
  const averagePrice = greaterThanWorklet(tokensSold, '0') ? divWorklet(grossProceedsUsd, tokensSold) : '0';
  const fee = mulWorklet(tokensSold, feePerToken);
  const expectedPayoutUsd = subWorklet(grossProceedsUsd, fee);

  const bestAskPrice = orderBook.asks.at(-1)?.price ?? '0';
  const bestBidPrice = orderBook.bids.at(-1)?.price ?? '0';
  const hasNoLiquidityAtMarketPrice = !greaterThanWorklet(bestBidPrice, '0');
  const spread =
    greaterThanWorklet(bestAskPrice, '0') && greaterThanWorklet(bestBidPrice, '0') ? subWorklet(bestAskPrice, bestBidPrice) : '0';

  return {
    averagePrice,
    worstPrice,
    bestPrice: bestBidPrice,
    fee,
    tokensSold,
    grossProceedsUsd,
    expectedPayoutUsd,
    hasInsufficientLiquidity,
    hasNoLiquidityAtMarketPrice,
    spread,
  };
}
