import { Chain, ClobClient } from '@polymarket/clob-client-v2';

import { POLYMARKET_CLOB_URL } from '@/features/polymarket/constants';

/**
 * This client should be used for all requests that do not require authentication
 * e.g. getPricesHistory, getOrderbook, getPrices, etc.
 */
export const polymarketClobDataClient = new ClobClient({
  host: POLYMARKET_CLOB_URL,
  chain: Chain.POLYGON,
});
