import { Chain, ClobClient } from '@polymarket/clob-client';
import { POLYMARKET_CLOB_URL } from '@/features/polymarket/constants';

/**
 * This client should be used for all requests that do not require authentication
 * e.g. getPricesHistory, getOrderbook, getPrices, etc.
 */
export const polymarketClobDataClient = new ClobClient(POLYMARKET_CLOB_URL, Chain.POLYGON);
