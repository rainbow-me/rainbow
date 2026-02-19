import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { toPercentageWorklet } from '@/framework/core/safeMath';
import { useMemo } from 'react';
import { useStableValue } from '@/hooks/useStableValue';
import { createOrderFormStore } from '../stores/createOrderFormStore';
import { createOrderExecutionStore } from '../stores/createOrderExecutionStore';
import { useOrderValidation } from './useOrderValidation';

type UseNewPositionFormParams = {
  tokenId: string;
};

export function useNewPositionForm({ tokenId }: UseNewPositionFormParams) {
  const liveAvailableBalance = usePolymarketBalanceStore(state => state.getBalance());
  const availableBalance = useStableValue(() => liveAvailableBalance);

  const { orderFormStore, executionStore } = useStableValue(() => {
    const orderFormStore = createOrderFormStore();
    const executionStore = createOrderExecutionStore(orderFormStore, tokenId);
    return { orderFormStore, executionStore };
  });

  const buyAmount = orderFormStore(state => state.buyAmount);
  const setBuyAmount = orderFormStore(state => state.setBuyAmount);

  const { bestPrice, averagePrice, worstPrice, spread, fee, tokensBought, minBuyAmountUsd, hasInsufficientLiquidity } = executionStore(
    state => state
  );

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
  };
}
