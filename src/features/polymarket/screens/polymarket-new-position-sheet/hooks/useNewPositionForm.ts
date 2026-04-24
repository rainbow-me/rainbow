import { useEffect, useMemo } from 'react';

import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { prefetchPolymarketFeeInfo } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { toPercentageWorklet } from '@/framework/core/safeMath';
import { useStableValue } from '@/hooks/useStableValue';

import { createOrderExecutionStore } from '../stores/createOrderExecutionStore';
import { createOrderFormStore } from '../stores/createOrderFormStore';
import { useOrderValidation } from './useOrderValidation';

type UseNewPositionFormParams = {
  conditionId: string;
  tokenId: string;
};

export function useNewPositionForm({ tokenId, conditionId }: UseNewPositionFormParams) {
  const liveAvailableBalance = usePolymarketBalanceStore(state => state.getBalance());
  const availableBalance = useStableValue(() => liveAvailableBalance);

  useEffect(() => {
    void prefetchPolymarketFeeInfo(conditionId);
  }, [conditionId]);

  const { orderFormStore, executionStore } = useStableValue(() => {
    const orderFormStore = createOrderFormStore();
    const executionStore = createOrderExecutionStore(orderFormStore, tokenId, conditionId);
    return { orderFormStore, executionStore };
  });

  const buyAmount = orderFormStore(state => state.buyAmount);
  const setBuyAmount = orderFormStore(state => state.setBuyAmount);

  const {
    bestPrice,
    averagePrice,
    worstPrice,
    spread,
    fee,
    tokensBought,
    minBuyAmountUsd,
    hasNoLiquidityAtMarketPrice,
    hasInsufficientLiquidity,
  } = executionStore(state => state);

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
    setBuyAmount,
    buyAmount,
    validation,
    isValidOrderAmount: isValid,
    hasNoLiquidityAtMarketPrice,
    hasInsufficientLiquidity,
  };
}
