import { ChainId as SwapsChainId, CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';
import { ChainId } from '@/state/backendNetworks/types';

import { DepositQuoteStatus } from '../types';

// ============ Constants ====================================================== //

const SUPPRESSED_QUOTE_ERRORS = new Set(['error parsing sellAmount']);

// ============ Error Suppression ============================================== //

export function shouldSuppressQuoteError(message: string): boolean {
  return SUPPRESSED_QUOTE_ERRORS.has(message);
}

// ============ Type Guards ==================================================== //

export function isQuoteError(data: unknown): data is QuoteError {
  return typeof data === 'object' && data !== null && 'error' in data && data.error === true;
}

export function isQuote(data: Quote | QuoteError | null): data is Quote {
  return typeof data === 'object' && data !== null && 'sellAmount' in data && 'buyAmount' in data && !isQuoteError(data);
}

export function isCrosschainQuote(data: Quote | CrosschainQuote | QuoteError | null): data is CrosschainQuote {
  return typeof data === 'object' && data !== null && 'swapType' in data && data.swapType === SwapType.crossChain;
}

export function isValidSwapsChainId(chainId: ChainId | SwapsChainId): chainId is SwapsChainId {
  return Object.prototype.hasOwnProperty.call(SwapsChainId, chainId);
}

// ============ Quote Validation =============================================== //

export function isValidQuote(
  quote: Quote | CrosschainQuote | QuoteError | DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.InsufficientGas | null
): quote is Quote | CrosschainQuote {
  if (!quote || quote === DepositQuoteStatus.InsufficientBalance || quote === DepositQuoteStatus.InsufficientGas || isQuoteError(quote))
    return false;
  return true;
}

export function crosschainQuoteTargetsRecipient(quote: CrosschainQuote, recipient: string): boolean {
  if (!recipient) return false;

  const normalized = recipient.toLowerCase();
  const routes = quote.routes ?? [];

  if (routes.length === 0) return true;

  return routes.every(route => {
    const routeRecipientOk = !route.recipient || route.recipient.toLowerCase() === normalized;
    const txRecipientsOk = (route.userTxs ?? []).every(tx => !tx.recipient || tx.recipient.toLowerCase() === normalized);
    return routeRecipientOk && txRecipientsOk;
  });
}
