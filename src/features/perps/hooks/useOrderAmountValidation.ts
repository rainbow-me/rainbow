import { MIN_ORDER_SIZE_USD } from '@/features/perps/constants';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { useMemo } from 'react';

export const useOrderAmountValidation = () => {
  const availableBalance = useHyperliquidAccountStore(state => state.balance);
  const amount = useHlNewPositionStore(state => state.amount);
  const leverage = useHlNewPositionStore(state => state.leverage);

  const minAmount = useMemo(() => {
    if (!leverage) return String(MIN_ORDER_SIZE_USD);
    // Add 2% buffer to account for decimal precision in position size calculation
    const rawAmount = (MIN_ORDER_SIZE_USD * 1.02) / leverage;
    return String(Math.ceil(rawAmount * 100) / 100);
  }, [leverage]);

  const { isBelowMin, isAboveMax } = useMemo(() => {
    if (!leverage) return { isBelowMin: false, isAboveMax: false };
    const amountNumber = Number(amount);
    const isBelowMin = amountNumber < Number(minAmount);
    const isAboveMax = amountNumber > Number(availableBalance);
    return { isBelowMin, isAboveMax };
  }, [amount, leverage, availableBalance, minAmount]);

  return { isBelowMin, isAboveMax, minAmount, maxAmount: availableBalance, isValid: !isBelowMin && !isAboveMax };
};
