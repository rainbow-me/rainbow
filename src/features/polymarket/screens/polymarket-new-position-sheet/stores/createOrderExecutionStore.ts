import { OrderBook, usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { DerivedStore, InferStoreState, Selector } from '@/state/internal/types';
import { shallowEqual } from '@/worklets/comparisons';
import { calculateOrderExecution, OrderExecution } from '../utils/calculateOrderExecution';
import { OrderFormStore } from './createOrderFormStore';

type OrderExecutionStore = DerivedStore<OrderExecution>;

export function createOrderExecutionStore(orderFormStore: OrderFormStore, tokenId: string): OrderExecutionStore {
  const orderBookSelector = createOrderBookSelector(tokenId);
  return createDerivedStore(
    $ => {
      const orderBook = $(usePolymarketOrderBookStore, orderBookSelector, isSameOrderBook);
      const buyAmount = $(orderFormStore, state => state.buyAmount);
      return calculateOrderExecution({ orderBook, buyAmountUsd: buyAmount });
    },
    {
      equalityFn: shallowEqual,
      fastMode: true,
    }
  );
}

// ============ Helpers ======================================================== //

type OrderBookQueryState = InferStoreState<typeof usePolymarketOrderBookStore>;

function createOrderBookSelector(tokenId: string): Selector<OrderBookQueryState, ReturnType<OrderBookQueryState['getData']>> {
  return state => state.getData({ tokenId });
}

function isSameOrderBook(previousOrderBook: OrderBook | null, nextOrderBook: OrderBook | null): boolean {
  if (previousOrderBook === nextOrderBook) return true;
  if (!previousOrderBook || !nextOrderBook) return false;
  return previousOrderBook.hash === nextOrderBook.hash;
}
