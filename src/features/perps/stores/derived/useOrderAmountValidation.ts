import { createDerivedStore } from '@storesjs/stores';

import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { buildOrderAmountValidation } from '@/features/perps/utils/buildOrderAmountValidation';
import { shallowEqual } from '@/worklets/comparisons';

export const useOrderAmountValidation = createDerivedStore(
  $ => {
    const availableBalance = $(useHyperliquidAccountStore, state => state.getBalance());
    const leverage = $(useHlNewPositionStore, state => state.leverage);
    const newPositionAmount = $(useHlNewPositionStore, state => state.amount);
    const marketMarginTiers = $(useHlNewPositionStore, state => state.market?.marginTiers);

    return buildOrderAmountValidation({
      amount: newPositionAmount,
      availableBalance,
      leverage,
      marginTiers: marketMarginTiers,
    });
  },
  {
    equalityFn: shallowEqual,
    lockDependencies: true,
  }
);
