import { type NumberPadCharacter, type NumberPadField } from '@/components/number-pad/NumberPadKey';

export const ADD_CASH_AMOUNT_FIELD_ID = 'cash';
export const ADD_CASH_AMOUNT_MAX_DECIMALS = 2;

export const ADD_CASH_DEFAULT_VALUE = '0';
export const ADD_CASH_MIN_AMOUNT_USD = 5;
export const ADD_CASH_MAX_AMOUNT_USD = 9_999.99;

export type CashFieldId = typeof ADD_CASH_AMOUNT_FIELD_ID;

export function createCashAmountField(value = ADD_CASH_DEFAULT_VALUE): Record<CashFieldId, NumberPadField> {
  return {
    [ADD_CASH_AMOUNT_FIELD_ID]: {
      allowDecimals: true,
      allowNegative: false,
      id: ADD_CASH_AMOUNT_FIELD_ID,
      maxDecimals: ADD_CASH_AMOUNT_MAX_DECIMALS,
      value,
    },
  };
}

export function isSubmittableCashAmount(amount: string): boolean {
  const value = Number(amount);
  return value >= ADD_CASH_MIN_AMOUNT_USD && value <= ADD_CASH_MAX_AMOUNT_USD;
}

export function isValidCashAmountChange(currentValue: string, newValue: string, key: NumberPadCharacter): boolean {
  'worklet';
  if (newValue === currentValue) return false;
  return key === 'backspace' || Number(newValue) <= ADD_CASH_MAX_AMOUNT_USD;
}
