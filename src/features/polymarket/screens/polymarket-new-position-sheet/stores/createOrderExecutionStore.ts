import { createDerivedStore, type DerivedStore } from '@storesjs/stores';

import {
  calculateBuyOrderExecution,
  type BuyOrderExecution,
} from '@/features/polymarket/screens/polymarket-new-position-sheet/utils/calculateBuyOrderExecution';
import { usePolymarketFeeInfoStore } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { isSameOrderBook, usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { shallowEqual } from '@/worklets/comparisons';

import { type OrderFormStore } from './createOrderFormStore';

export function createOrderExecutionStore(orderFormStore: OrderFormStore): DerivedStore<BuyOrderExecution> {
  return createDerivedStore(
    $ => {
      const feeInfo = $(usePolymarketFeeInfoStore, s => s.getData());
      const orderBook = $(usePolymarketOrderBookStore, s => s.getData(), isSameOrderBook);
      const buyAmount = $(orderFormStore, s => s.buyAmount);

      return calculateBuyOrderExecution({ feeInfo, orderBook, buyAmountUsd: buyAmount });
    },
    {
      equalityFn: shallowEqual,
      lockDependencies: true,
    }
  );
}
