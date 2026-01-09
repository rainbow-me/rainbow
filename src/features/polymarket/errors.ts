/**
 * Error messages returned by the Polymarket CLOB API
 */
export const POLYMARKET_CLOB_API_ERRORS = {
  FOK_ORDER_NOT_FILLED: "order couldn't be fully filled. FOK orders are fully filled or killed.",
  NO_MATCH: 'no match',
} as const;
