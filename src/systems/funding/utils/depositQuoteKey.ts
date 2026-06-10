import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

/**
 * Builds a stable identity for the executable parts of a deposit quote.
 */
export function buildDepositQuoteKey(quote: Quote | CrosschainQuote): string {
  const base = {
    allowanceTarget: quote.allowanceTarget.toLowerCase(),
    buyAmount: quote.buyAmount?.toString() ?? null,
    buyTokenAddress: quote.buyTokenAddress.toLowerCase(),
    chainId: quote.chainId,
    data: quote.data,
    fallback: quote.fallback ?? false,
    from: quote.from.toLowerCase(),
    sellAmount: quote.sellAmount?.toString() ?? null,
    sellTokenAddress: quote.sellTokenAddress.toLowerCase(),
    swapType: quote.swapType,
    to: quote.to?.toLowerCase() ?? null,
    value: quote.value?.toString() ?? null,
  };

  if (!isCrosschainQuote(quote)) return JSON.stringify(base);

  return JSON.stringify({
    ...base,
    refuel: quote.refuel,
    routes: quote.routes,
  });
}
