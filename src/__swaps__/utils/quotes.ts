import { CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';

// ============ Constants ====================================================== //

const SUPPRESSED_QUOTE_ERRORS = new Set(['error parsing sellAmount']);

// ============ Error Suppression ============================================== //

/**
 * Returns true for quote errors we intentionally suppress in UI/reporting flows.
 */
export function shouldSuppressQuoteError(message: string): boolean {
  return SUPPRESSED_QUOTE_ERRORS.has(message);
}

// ============ Type Guards ==================================================== //

/**
 * Runtime guard for quote error payloads.
 */
export function isQuoteError(data: unknown): data is QuoteError {
  return typeof data === 'object' && data !== null && 'error' in data && data.error === true;
}

/**
 * Runtime guard for successful quote payloads.
 */
export function isQuote(data: Quote | QuoteError | null): data is Quote {
  return typeof data === 'object' && data !== null && 'sellAmount' in data && 'buyAmount' in data && !isQuoteError(data);
}

/**
 * Runtime guard for crosschain quote payloads.
 */
export function isCrosschainQuote(data: Quote | CrosschainQuote | QuoteError | null): data is CrosschainQuote {
  return typeof data === 'object' && data !== null && 'swapType' in data && data.swapType === SwapType.crossChain;
}

// ============ Crosschain Validation ========================================== //

const EMPTY_TRANSACTIONS = Object.freeze([]);

/**
 * Ensures all recipient fields in a crosschain quote (when present)
 * match the expected recipient. Empty routes are treated as valid.
 */
export function crosschainQuoteTargetsRecipient(quote: CrosschainQuote, recipient: string): boolean {
  if (!recipient) return false;
  if (quote.routes.length === 0) return true;

  const normalized = recipient.toLowerCase();

  return quote.routes.every(route => {
    const routeRecipientOk = !route.recipient || route.recipient.toLowerCase() === normalized;
    const txRecipientsOk = (route.userTxs ?? EMPTY_TRANSACTIONS).every(tx => !tx.recipient || tx.recipient.toLowerCase() === normalized);
    return routeRecipientOk && txRecipientsOk;
  });
}
