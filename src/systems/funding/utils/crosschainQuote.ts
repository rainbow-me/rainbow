import { buildRainbowCrosschainQuoteUrl, CrosschainQuote, QuoteError, QuoteParams } from '@rainbow-me/swaps';

import { crosschainQuoteTargetsRecipient, isCrosschainQuote, isQuoteError, shouldSuppressQuoteError } from './quotes';

// ============ Crosschain Quote Fetching ====================================== //

export async function fetchCrosschainQuoteWithReceiver(
  params: QuoteParams,
  abortSignal?: AbortSignal
): Promise<CrosschainQuote | QuoteError | null> {
  const { sellAmount, toChainId } = params;
  if (!sellAmount || !toChainId) return null;

  const url = buildRainbowCrosschainQuoteUrl(params);
  const response = await fetch(url, { signal: abortSignal });
  const data: CrosschainQuote | QuoteError | null = await response.json();

  if (isQuoteError(data)) return data;
  if (!isCrosschainQuote(data)) return null;

  return data;
}

// ============ Crosschain Quote Validation ==================================== //

export async function fetchAndValidateCrosschainQuote(
  params: QuoteParams,
  destReceiver: string | null,
  signal?: AbortSignal
): Promise<CrosschainQuote | null> {
  const result = await fetchCrosschainQuoteWithReceiver(params, signal);
  if (!result) return null;
  if (isQuoteError(result)) {
    if (shouldSuppressQuoteError(result.message)) return null;
    throw new Error(result.message);
  }
  if (destReceiver && !crosschainQuoteTargetsRecipient(result, destReceiver)) {
    throw new Error('Crosschain quote did not target recipient');
  }
  return result;
}
