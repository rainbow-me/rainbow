import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { greaterThanWorklet, lessThanWorklet } from '@/safe-math/SafeMath';
import { useState } from 'react';
import { useDerivedValue, SharedValue } from 'react-native-reanimated';

type OrderValidation = {
  isAboveMax: boolean;
  isBelowMin: boolean;
  isValid: boolean;
  maxAmount: string;
  minAmount: string;
};

type UseOrderValidationParams = {
  buyAmount: string;
  availableBalance: string;
  minBuyAmountUsd: string;
};

type UseOrderValidationResult = {
  validation: SharedValue<OrderValidation>;
  isValid: boolean;
};

export function useOrderValidation({ buyAmount, availableBalance, minBuyAmountUsd }: UseOrderValidationParams): UseOrderValidationResult {
  const validation = useDerivedValue(() => {
    'worklet';

    const maxAmount = availableBalance;
    // const minAmount = String(minBuyAmountUsd);
    // TESTING
    const minAmount = String('2');

    const isAboveMax = greaterThanWorklet(buyAmount, maxAmount);
    const isBelowMin = lessThanWorklet(buyAmount, minAmount);

    const isValid = !isAboveMax && !isBelowMin;

    return {
      isAboveMax,
      isBelowMin,
      isValid,
      maxAmount,
      minAmount,
    };
  });

  const isValidDerived = useDerivedValue(() => {
    'worklet';
    return validation.value.isValid;
  });

  const [isValid, setIsValid] = useState(false);

  useSyncSharedValue({
    setState: setIsValid,
    sharedValue: isValidDerived,
    state: isValid,
    syncDirection: 'sharedValueToState',
  });

  return {
    validation,
    isValid,
  };
}
