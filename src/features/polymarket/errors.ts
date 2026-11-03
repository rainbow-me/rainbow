import { RainbowError } from '@/logger';

/**
 * Error messages returned by the Polymarket CLOB API
 */
export const POLYMARKET_CLOB_API_ERRORS = {
  FOK_ORDER_NOT_FILLED: "order couldn't be fully filled. FOK orders are fully filled or killed.",
  NO_MATCH: 'no match',
} as const;

export type PolymarketClobOrderErrorReason = 'no_liquidity_at_price' | 'not_enough_liquidity';

export function getPolymarketClobOrderErrorReason(error: Error): PolymarketClobOrderErrorReason | undefined {
  if (error.message === POLYMARKET_CLOB_API_ERRORS.FOK_ORDER_NOT_FILLED) {
    return 'not_enough_liquidity';
  }

  if (error.message === POLYMARKET_CLOB_API_ERRORS.NO_MATCH) {
    return 'no_liquidity_at_price';
  }
}

export type PolymarketBuyPositionErrorReason = 'collateral_conversion_failed' | 'trading_approval_failed';

export class PolymarketBuyPositionError extends RainbowError {
  reason: PolymarketBuyPositionErrorReason;

  constructor(cause: unknown, reason: PolymarketBuyPositionErrorReason) {
    super(`[polymarket] Failed to buy position: ${reason}`, cause);
    this.reason = reason;
  }
}
