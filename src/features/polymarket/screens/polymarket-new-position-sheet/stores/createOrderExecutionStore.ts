import { usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { DerivedStore } from '@/state/internal/types';
import { shallowEqual } from '@/worklets/comparisons';
import { dequal } from 'dequal';
import { OrderFormStore } from './createOrderFormStore';
import { calculateOrderExecution, OrderExecution } from '../utils/calculateOrderExecution';

type OrderExecutionStore = DerivedStore<OrderExecution>;

export function createOrderExecutionStore(orderFormStore: OrderFormStore, tokenId: string): OrderExecutionStore {
  return createDerivedStore(
    $ => {
      const orderBook = $(usePolymarketOrderBookStore, state => state.getData({ tokenId }), dequal);
      const buyAmount = $(orderFormStore, state => state.buyAmount);
      return calculateOrderExecution({ orderBook, buyAmountUsd: buyAmount });
    },
    {
      equalityFn: shallowEqual,
      fastMode: true,
    }
  );
}
