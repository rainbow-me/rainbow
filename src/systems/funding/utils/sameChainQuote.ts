import { buildRainbowQuoteUrl, type Quote, type QuoteError, type QuoteParams, SwapType } from '@rainbow-me/swaps';
import { isQuote, isQuoteError, shouldSuppressQuoteError } from '@/__swaps__/utils/quotes';

// ============ Same-Chain Quote Fetching ====================================== //

export async function fetchSwapQuoteWithReceiver(params: QuoteParams, abortSignal?: AbortSignal): Promise<Quote | QuoteError | null> {
  const { buyTokenAddress, sellAmount, sellTokenAddress } = params;

  const isSameToken = buyTokenAddress.toLowerCase() === sellTokenAddress.toLowerCase();
  if (!sellAmount || isSameToken) return null;

  const url = buildRainbowQuoteUrl(params);
  const response = await fetch(url, { signal: abortSignal });
  const data: Quote | QuoteError | null = await response.json();

  if (isQuoteError(data)) return data;
  if (!isQuote(data)) return null;

  return data;
}

// ============ Same-Chain Quote Validation ==================================== //

export async function fetchAndValidateSameChainQuote(params: QuoteParams, signal?: AbortSignal): Promise<Quote | null> {
  const result = await fetchSwapQuoteWithReceiver(params, signal);
  if (!result) return null;
  if (isQuoteError(result)) {
    if (shouldSuppressQuoteError(result.message)) return null;
    throw new Error(result.message);
  }
  return { ...result, swapType: SwapType.normal };
}
