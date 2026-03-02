import { ChainId as SwapsChainId, type CrosschainQuote, type Quote, type QuoteError } from '@rainbow-me/swaps';
import { type ChainId } from '@/state/backendNetworks/types';
import { isQuoteError } from '@/__swaps__/utils/quotes';
import { DepositQuoteStatus } from '../types';

// ============ Chain Guards =================================================== //

export function isValidSwapsChainId(chainId: ChainId | SwapsChainId): chainId is SwapsChainId {
  return Object.prototype.hasOwnProperty.call(SwapsChainId, chainId);
}

// ============ Quote Validation =============================================== //

export function isValidQuote(
  quote:
    | Quote
    | CrosschainQuote
    | QuoteError
    | DepositQuoteStatus.Error
    | DepositQuoteStatus.InsufficientBalance
    | DepositQuoteStatus.InsufficientGas
    | null
): quote is Quote | CrosschainQuote {
  if (
    !quote ||
    quote === DepositQuoteStatus.Error ||
    quote === DepositQuoteStatus.InsufficientBalance ||
    quote === DepositQuoteStatus.InsufficientGas ||
    isQuoteError(quote)
  ) {
    return false;
  }
  return true;
}
