import { createDerivedStore, type DerivedStore, type InferStoreState, type Selector } from '@storesjs/stores';

import {
  calculateBuyOrderExecution,
  type BuyOrderExecution,
} from '@/features/polymarket/screens/polymarket-new-position-sheet/utils/calculateBuyOrderExecution';
import { usePolymarketFeeInfoStore } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { usePolymarketOrderBookStore, type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { shallowEqual } from '@/worklets/comparisons';

import { type OrderFormStore } from './createOrderFormStore';

type OrderExecutionStore = DerivedStore<BuyOrderExecution>;

export function createOrderExecutionStore(orderFormStore: OrderFormStore, tokenId: string, conditionId: string): OrderExecutionStore {
  const orderBookSelector = createOrderBookSelector(tokenId);
  const feeInfoSelector = createFeeInfoSelector(conditionId);
  return createDerivedStore(
    $ => {
      const feeInfo = $(usePolymarketFeeInfoStore, feeInfoSelector);
      const orderBook = $(usePolymarketOrderBookStore, orderBookSelector, isSameOrderBook);
      const buyAmount = $(orderFormStore, state => state.buyAmount);
      return calculateBuyOrderExecution({ feeInfo, orderBook, buyAmountUsd: buyAmount });
    },
    {
      equalityFn: shallowEqual,
      lockDependencies: true,
    }
  );
}

// ============ Helpers ======================================================== //

type FeeInfoQueryState = InferStoreState<typeof usePolymarketFeeInfoStore>;
type OrderBookQueryState = InferStoreState<typeof usePolymarketOrderBookStore>;

function createOrderBookSelector(tokenId: string): Selector<OrderBookQueryState, OrderBook | null> {
  return state => state.getData({ tokenId });
}

function createFeeInfoSelector(conditionId: string): Selector<FeeInfoQueryState, PolymarketFeeInfo | null> {
  return state => state.getData({ conditionId });
}

function isSameOrderBook(previousOrderBook: OrderBook | null, nextOrderBook: OrderBook | null): boolean {
  if (previousOrderBook === nextOrderBook) return true;
  if (!previousOrderBook || !nextOrderBook) return false;
  return previousOrderBook.hash === nextOrderBook.hash;
}
