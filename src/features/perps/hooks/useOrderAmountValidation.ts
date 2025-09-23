import { MIN_ORDER_SIZE_USD } from '@/features/perps/constants';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { calculateMaxMarginForLeverage } from '@/features/perps/utils/calculateMaxMarginForLeverage';
import { greaterThan } from '@/helpers/utilities';
import { useMemo } from 'react';

export const useOrderAmountValidation = () => {
  const availableBalance = useHyperliquidAccountStore(state => state.balance);
  const amount = useHlNewPositionStore(state => state.amount);
  const leverage = useHlNewPositionStore(state => state.leverage);
  const market = useHlNewPositionStore(state => state.market);

  const minAmount = useMemo(() => {
    if (!leverage) return String(MIN_ORDER_SIZE_USD);
    const rawAmount = MIN_ORDER_SIZE_USD / leverage;
    return String(Math.ceil(rawAmount * 100) / 100);
  }, [leverage]);

  const maxAmount = useMemo(() => {
    if (greaterThan(amount, availableBalance) || !market || !leverage) return availableBalance;

    // These maximums are very large, and it is likely no user will hit them
    const maxMarginForLeverage = calculateMaxMarginForLeverage({
      market,
      leverage,
    });

    return maxMarginForLeverage || availableBalance;
  }, [amount, availableBalance, market, leverage]);

  const { isBelowMin, isAboveMax } = useMemo(() => {
    if (!leverage) return { isBelowMin: false, isAboveMax: false };
    const amountNumber = Number(amount);
    const isBelowMin = amountNumber < Number(minAmount);
    const isAboveMax = amountNumber > Number(maxAmount);

    return { isBelowMin, isAboveMax };
  }, [amount, leverage, minAmount, maxAmount]);

  return {
    isBelowMin,
    isAboveMax,
    minAmount,
    maxAmount,
    isValid: !isBelowMin && !isAboveMax,
  };
};
