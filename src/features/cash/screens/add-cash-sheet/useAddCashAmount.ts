import { useCallback, useState } from 'react';

import { runOnJS, useSharedValue } from 'react-native-reanimated';

import {
  ADD_CASH_AMOUNT_FIELD_ID,
  ADD_CASH_DEFAULT_VALUE,
  createCashAmountField,
  isSubmittableCashAmount,
  type CashFieldId,
} from './addCashAmountModel';

/**
 * Owns the Add Cash amount as one canonical JS string while exposing the shared
 * values the on-thread NumberPad and AnimatedText need.
 */
export function useAddCashAmount(defaultPresetAmount: number) {
  const defaultPresetValue = String(defaultPresetAmount);
  const fields = useSharedValue(createCashAmountField());
  const activeFieldId = useSharedValue<CashFieldId>(ADD_CASH_AMOUNT_FIELD_ID);
  const displayedAmount = useSharedValue(ADD_CASH_DEFAULT_VALUE);

  const [amount, setAmount] = useState(defaultPresetValue);
  const [selectedPresetAmount, setSelectedPresetAmount] = useState(defaultPresetAmount);

  const selectPresetAmount = useCallback((presetAmount: number) => {
    setSelectedPresetAmount(presetAmount);
    setAmount(String(presetAmount));
  }, []);

  // The NumberPad calls this on the UI thread, so it must be a worklet.
  const onValueChange = useCallback(
    (_fieldId: CashFieldId, newValue: string | number) => {
      'worklet';
      const nextAmount = String(newValue);
      displayedAmount.value = nextAmount;
      runOnJS(setAmount)(nextAmount);
    },
    [displayedAmount]
  );

  const resetKeypadAmount = useCallback(() => {
    setAmount(ADD_CASH_DEFAULT_VALUE);
    displayedAmount.value = ADD_CASH_DEFAULT_VALUE;
    fields.modify(current => {
      'worklet';
      current[ADD_CASH_AMOUNT_FIELD_ID].value = ADD_CASH_DEFAULT_VALUE;
      return current;
    });
  }, [displayedAmount, fields]);

  return {
    activeFieldId,
    amount,
    canSubmit: isSubmittableCashAmount(amount),
    displayedAmount,
    fields,
    onValueChange,
    resetKeypadAmount,
    selectPresetAmount,
    selectedPresetAmount,
  };
}
