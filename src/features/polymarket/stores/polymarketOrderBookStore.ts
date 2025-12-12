import { POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';
import { rainbowFetch } from '@/rainbow-fetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

export type Order = {
  price: string;
  size: string;
};

type RawOrderBook = {
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

export type OrderBook = Omit<RawOrderBook, 'hash' | 'timestamp'>;

const EMPTY_ORDER_BOOK: OrderBook = {
  market: '',
  asset_id: '',
  bids: [],
  asks: [],
  min_order_size: '',
  tick_size: '',
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
    staleTime: time.seconds(1),
  },
  set => ({
    tokenId: null,
    setTokenId: (tokenId: string | null) => set({ tokenId }),
  })
);

async function fetchPolymarketOrderBook({ tokenId }: FetchParams): Promise<OrderBook> {
  if (!tokenId) return EMPTY_ORDER_BOOK;
  const { data } = await rainbowFetch<RawOrderBook>(`${POLYMARKET_CLOB_PROXY_URL}/book?token_id=${tokenId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hash, timestamp, ...orderBook } = data;

  return orderBook;
}
