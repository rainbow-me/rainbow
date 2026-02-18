import { ChainId as SwapsChainId, CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { ChainId } from '@/state/backendNetworks/types';
import { isQuoteError as isSharedQuoteError } from '@/__swaps__/utils/quotes';

import { DepositQuoteStatus } from '../types';

// ============ Chain Guards =================================================== //

export function isValidSwapsChainId(chainId: ChainId | SwapsChainId): chainId is SwapsChainId {
  return Object.prototype.hasOwnProperty.call(SwapsChainId, chainId);
}

// ============ Quote Validation =============================================== //

export function isValidQuote(
  quote: Quote | CrosschainQuote | QuoteError | DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.InsufficientGas | null
): quote is Quote | CrosschainQuote {
  if (
    !quote ||
    quote === DepositQuoteStatus.InsufficientBalance ||
    quote === DepositQuoteStatus.InsufficientGas ||
    isSharedQuoteError(quote)
  ) {
    return false;
  }
  return true;
}
