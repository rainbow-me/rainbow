import { createDerivedStore, type DerivedStore } from '@storesjs/stores';

import { usePolymarketFeeInfoStore } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { isSameOrderBook, usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { shallowEqual } from '@/worklets/comparisons';

import { calculateSellExecution, type SellExecution } from '../utils/calculateSellExecution';

export function createSellExecutionStore(sellAmountTokens: string): DerivedStore<SellExecution> {
  return createDerivedStore(
    $ => {
      const feeInfo = $(usePolymarketFeeInfoStore, s => s.getData());
      const orderBook = $(usePolymarketOrderBookStore, s => s.getData(), isSameOrderBook);

      return calculateSellExecution({ feeInfo, orderBook, sellAmountTokens });
    },
    {
      equalityFn: shallowEqual,
      lockDependencies: true,
    }
  );
}
