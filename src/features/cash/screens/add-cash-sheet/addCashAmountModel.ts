import { type NumberPadField } from '@/components/number-pad/NumberPadKey';

export const ADD_CASH_AMOUNT_FIELD_ID = 'cash';
export const ADD_CASH_AMOUNT_MAX_DECIMALS = 2;
export const ADD_CASH_DEFAULT_VALUE = '0';

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
  return Number(amount) > 0;
}
