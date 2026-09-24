import type { NumberPadCharacter } from '@/components/number-pad/NumberPadKey';

import {
  ADD_CASH_AMOUNT_FIELD_ID,
  ADD_CASH_MAX_AMOUNT_USD,
  ADD_CASH_MIN_AMOUNT_USD,
  createCashAmountField,
  isSubmittableCashAmount,
  isValidCashAmountChange,
} from './addCashAmountModel';

const maxAmount = ADD_CASH_MAX_AMOUNT_USD.toFixed(2);
const aboveMaxAmount = (ADD_CASH_MAX_AMOUNT_USD + 0.01).toFixed(2);
const aboveMaxInteger = String(Math.floor(ADD_CASH_MAX_AMOUNT_USD) + 1);

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
    expect(isSubmittableCashAmount((ADD_CASH_MIN_AMOUNT_USD - 0.01).toFixed(2))).toBe(false);
    expect(isSubmittableCashAmount(String(ADD_CASH_MIN_AMOUNT_USD))).toBe(true);
    expect(isSubmittableCashAmount('50')).toBe(true);
    expect(isSubmittableCashAmount(maxAmount)).toBe(true);
    expect(isSubmittableCashAmount(aboveMaxAmount)).toBe(false);
  });

  it.each<[string, string, NumberPadCharacter, boolean]>([
    ['0', '0', 'backspace', false],
    ['0', '0', 0, false],
    ['0', '0.', '.', true],
    ['0.', '0.0', 0, true],
    ['100.2', '100.20', 0, true],
    ['1', '0', 'backspace', true],
    ['0.0', '0.', 'backspace', true],
    [maxAmount.slice(0, -1), maxAmount, Number(maxAmount.slice(-1)), true],
    [aboveMaxInteger.slice(0, -1), aboveMaxInteger, Number(aboveMaxInteger.slice(-1)), false],
    [aboveMaxAmount.slice(0, -1), aboveMaxAmount, Number(aboveMaxAmount.slice(-1)), false],
    [maxAmount, `${maxAmount}1`, 1, false],
    [aboveMaxAmount, aboveMaxAmount.slice(0, -1), 'backspace', true],
  ])('%s → %s using %s: accepted = %s', (current, next, key, expected) => {
    expect(isValidCashAmountChange(current, next, key)).toBe(expected);
  });
});
