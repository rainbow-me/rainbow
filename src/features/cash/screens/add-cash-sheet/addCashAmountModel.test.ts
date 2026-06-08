import { ADD_CASH_AMOUNT_FIELD_ID, createCashAmountField, isSubmittableCashAmount } from './addCashAmountModel';

describe('addCashAmountModel', () => {
  it('builds the constrained cash keypad field', () => {
    expect(createCashAmountField()).toEqual({
      [ADD_CASH_AMOUNT_FIELD_ID]: {
        allowDecimals: true,
        allowNegative: false,
        id: ADD_CASH_AMOUNT_FIELD_ID,
        maxDecimals: 2,
        value: '0',
      },
    });
  });

  it('derives submit eligibility from the canonical amount string', () => {
    expect(isSubmittableCashAmount('0')).toBe(false);
    expect(isSubmittableCashAmount('0.')).toBe(false);
    expect(isSubmittableCashAmount('0.00')).toBe(false);
    expect(isSubmittableCashAmount('0.01')).toBe(true);
    expect(isSubmittableCashAmount('50')).toBe(true);
  });
});
