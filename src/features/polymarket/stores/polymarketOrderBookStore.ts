import { POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

export type Order = {
  price: string;
  size: string;
};

export type OrderBook = {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: Order[];
  asks: Order[];
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

type PolymarketOrderBookStoreState = {
  tokenId: string | null;
  setTokenId: (tokenId: string | null) => void;
};

type FetchParams = {
  tokenId: string | null;
};

export const usePolymarketOrderBookStore = createQueryStore<OrderBook, FetchParams, PolymarketOrderBookStoreState>(
  {
    fetcher: fetchPolymarketOrderBook,
    params: { tokenId: ($, store) => $(store).tokenId },
    cacheTime: time.minutes(1),
    staleTime: time.seconds(1),
  },
  set => ({
    tokenId: null,
    setTokenId: (tokenId: string | null) => set({ tokenId }),
  })
);

async function fetchPolymarketOrderBook({ tokenId }: FetchParams): Promise<OrderBook> {
  if (!tokenId) return EMPTY_ORDER_BOOK;
  const { data } = await rainbowFetch<OrderBook>(`${POLYMARKET_CLOB_PROXY_URL}/book?token_id=${tokenId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
