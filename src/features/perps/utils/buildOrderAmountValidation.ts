import { MIN_ORDER_SIZE_USD } from '@/features/perps/constants';
import { PerpMarket } from '@/features/perps/types';
import { calculateMaxMarginForLeverage } from '@/features/perps/utils/calculateMaxMarginForLeverage';
import { greaterThanWorklet } from '@/safe-math/SafeMath';

function getMaxAmount({
  availableBalance,
  marginTiers,
  leverage,
  amount,
}: {
  availableBalance: string;
  marginTiers: PerpMarket['marginTiers'] | undefined;
  leverage: number;
  amount: string;
}) {
  'worklet';
  if (greaterThanWorklet(amount, availableBalance) || !marginTiers || !leverage) return availableBalance;

  const maxMarginForLeverage = calculateMaxMarginForLeverage({
    marginTiers,
    leverage,
  });

  return maxMarginForLeverage || availableBalance;
}

export type OrderAmountValidation = {
  isAboveMax: boolean;
  isBelowMin: boolean;
  isValid: boolean;
  maxAmount: string;
  minAmount: string;
};

type BuildOrderAmountValidationParams = {
  amount: string;
  availableBalance: string;
  leverage: number | null | undefined;
  marginTiers: PerpMarket['marginTiers'] | undefined;
};

export function buildOrderAmountValidation({
  amount,
  availableBalance,
  leverage,
  marginTiers,
}: BuildOrderAmountValidationParams): OrderAmountValidation {
  'worklet';

  const validation: OrderAmountValidation = {
    isAboveMax: false,
    isBelowMin: false,
    isValid: false,
    maxAmount: availableBalance,
    minAmount: '0',
  };

  if (!leverage) {
    validation.minAmount = String(MIN_ORDER_SIZE_USD);
    return validation;
  }

  const maxAmount = getMaxAmount({ availableBalance, marginTiers, leverage, amount });

  const rawAmount = MIN_ORDER_SIZE_USD / leverage;
  const minAmount = String(Math.ceil(rawAmount * 100) / 100);
  validation.minAmount = minAmount;

  const amountNumber = Number(amount);
  const isAboveMax = amountNumber > Number(maxAmount);
  const isBelowMin = amountNumber < Number(minAmount);

  validation.isAboveMax = isAboveMax;
  validation.isBelowMin = isBelowMin;
  validation.isValid = !isAboveMax && !isBelowMin;

  return validation;
}
