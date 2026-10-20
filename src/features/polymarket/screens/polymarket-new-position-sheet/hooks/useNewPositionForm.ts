import { useMemo } from 'react';

import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { toPercentageWorklet } from '@/framework/core/safeMath';
import { useStableValue } from '@/hooks/useStableValue';

import { createOrderExecutionStore } from '../stores/createOrderExecutionStore';
import { createOrderFormStore } from '../stores/createOrderFormStore';
import { useOrderValidation } from './useOrderValidation';

export function useNewPositionForm() {
  const liveAvailableBalance = usePolymarketBalanceStore(s => s.getBalance());
  const availableBalance = useStableValue(() => liveAvailableBalance);

  const { orderFormStore, executionStore } = useStableValue(() => {
    const orderFormStore = createOrderFormStore();
    const executionStore = createOrderExecutionStore(orderFormStore);
    return { orderFormStore, executionStore };
  });

  const buyAmount = orderFormStore(s => s.buyAmount);
  const setBuyAmount = orderFormStore(s => s.setBuyAmount);

  const {
    bestPrice,
    averagePrice,
    worstPrice,
    spread,
    fee,
    orderSpendCap,
    rainbowFee,
    tokensBought,
    minBuyAmountUsd: executionMinBuyAmountUsd,
    hasNoLiquidityAtMarketPrice,
    hasInsufficientLiquidity,
    isQuoteReady,
  } = executionStore(s => s);

  const minBuyAmountUsd = executionMinBuyAmountUsd === '0' ? '1' : executionMinBuyAmountUsd;

  const { validation, isValid } = useOrderValidation({
    buyAmount,
    availableBalance,
    minBuyAmountUsd,
  });

  const outcomeOdds = useMemo(() => {
    return toPercentageWorklet(bestPrice);
  }, [bestPrice]);

  return {
    availableBalance,
    averagePrice,
    worstPrice,
    spread,
    amountToWin: tokensBought,
    outcomeOdds,
    bestPrice,
    fee,
    orderSpendCap,
    rainbowFee,
    setBuyAmount,
    buyAmount,
    validation,
    isValidOrderAmount: isValid,
    hasNoLiquidityAtMarketPrice,
    hasInsufficientLiquidity,
    isQuoteReady,
  };
}
