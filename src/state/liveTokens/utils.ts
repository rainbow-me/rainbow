import type { TokenData } from '@/state/liveTokens/types';

/**
 * Checks if a live token's price data is valid and trustworthy.
 */
export function isTrustedLiveToken(token: TokenData | undefined): token is TokenData {
  return token?.reliability.status === 'PRICE_RELIABILITY_STATUS_TRUSTED';
}
