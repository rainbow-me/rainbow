import { MIN_ORDER_SIZE_USD } from '@/features/perps/constants';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

type OrderAmountValidation = {
  isAboveMax: boolean;
  isBelowMin: boolean;
  isValid: boolean;
  maxAmount: string;
  minAmount: string;
};

export const useOrderAmountValidation = createDerivedStore(
  $ => {
    const availableBalance = $(useHyperliquidAccountStore, state => state.getBalance());
    const leverage = $(useHlNewPositionStore, state => state.leverage);
    const newPositionAmount = $(useHlNewPositionStore, state => state.amount);

    const orderValidation: OrderAmountValidation = {
      isAboveMax: false,
      isBelowMin: false,
      isValid: false,
      maxAmount: availableBalance,
      minAmount: '0',
    };

    if (!leverage) {
      orderValidation.minAmount = String(MIN_ORDER_SIZE_USD);
      return orderValidation;
    }

    const rawAmount = MIN_ORDER_SIZE_USD / leverage;
    const minAmount = String(Math.ceil(rawAmount * 100) / 100);
    orderValidation.minAmount = minAmount;

    const amountNumber = Number(newPositionAmount);
    const isAboveMax = amountNumber > Number(availableBalance);
    const isBelowMin = amountNumber < Number(minAmount);

    orderValidation.isAboveMax = isAboveMax;
    orderValidation.isBelowMin = isBelowMin;
    orderValidation.isValid = !isAboveMax && !isBelowMin;

    return orderValidation;
  },
  {
    equalityFn: shallowEqual,
    fastMode: true,
  }
);
