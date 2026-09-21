import { createQueryStore } from '@storesjs/stores';

import { POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';
import { polymarketOrderParamsStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

export type OrderBookLevel = {
  price: string;
  size: string;
};

export type OrderBook = {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  min_order_size: string;
  tick_size: string;
  neg_risk: boolean;
};

const EMPTY_ORDER_BOOK: OrderBook = {
  market: '',
  asset_id: '',
  hash: '',
  bids: [],
  asks: [],
  min_order_size: '',
  tick_size: '',
  timestamp: '',
  neg_risk: false,
};

type FetchParams = {
  tokenId: string | null;
};

export const usePolymarketOrderBookStore = createQueryStore<OrderBook, FetchParams>({
  fetcher: fetchPolymarketOrderBook,
  params: { tokenId: $ => $(polymarketOrderParamsStore).params?.tokenId ?? null },
  cacheTime: time.minutes(1),
  staleTime: time.seconds(1),
});

async function fetchPolymarketOrderBook({ tokenId }: FetchParams): Promise<OrderBook> {
  if (!tokenId) return EMPTY_ORDER_BOOK;
  const { data } = await rainbowFetch<OrderBook>(`${POLYMARKET_CLOB_PROXY_URL}/book?token_id=${tokenId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
