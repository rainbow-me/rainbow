import { QuoteStatus } from '@/features/perps/screens/perps-deposit-withdraw-screen/types';
import { CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';

// ============ Type Checks =================================================== //

export function isCrosschainQuote(quote: Quote | CrosschainQuote): quote is CrosschainQuote {
  return quote.swapType === SwapType.crossChain;
}

export function isValidQuote(
  quote: Quote | CrosschainQuote | QuoteError | QuoteStatus.InsufficientBalance | null
): quote is Quote | CrosschainQuote {
  if (!quote || quote === QuoteStatus.InsufficientBalance || 'error' in quote) return false;
  return true;
}
