import { Chain, ClobClient } from '@polymarket/clob-client';

const CLOB_URL = 'https://clob.polymarket.com/';

export const polymarketClobDataClient = new ClobClient(CLOB_URL, Chain.POLYGON);
