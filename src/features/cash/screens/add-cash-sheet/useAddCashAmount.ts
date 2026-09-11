import { useCallback } from 'react';

import { createBaseStore, useStableValue, type Store } from '@storesjs/stores';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { toAnalyticsAmount } from '@/analytics/utils';
import type { NumberPadProps } from '@/components/number-pad/NumberPad';
import { useShakeAnimation } from '@/hooks/useShakeAnimation';

import {
  ADD_CASH_AMOUNT_FIELD_ID,
  ADD_CASH_DEFAULT_VALUE,
  createCashAmountField,
  isSubmittableCashAmount,
  isValidCashAmountChange,
  type CashFieldId,
} from './addCashAmountModel';

export type AddCashStoreState = {
  amount: string;
  canSubmit: () => boolean;
  getSelectedAmountPreset: () => number;
  setAmount: (amount: string) => void;
};

/** Owns the Add Cash amount, submit eligibility, and keypad rejection feedback. */
export function useAddCashAmount(defaultPresetAmount: number) {
  const defaultPresetValue = String(defaultPresetAmount);
  const [shakeOffset, shake] = useShakeAnimation(10);

  const fields = useSharedValue(createCashAmountField());
  const activeFieldId = useSharedValue<CashFieldId>(ADD_CASH_AMOUNT_FIELD_ID);
  const displayedAmount = useSharedValue(defaultPresetValue);

  const addCashStore = useStableValue(() => createAddCashStore(defaultPresetAmount));
  const { setAmount } = addCashStore.getState();

  const selectPresetAmount = useCallback(
    (presetAmount: number) => {
      const nextAmount = String(presetAmount);
      setAmount(nextAmount);
      displayedAmount.value = nextAmount;
      analytics.track(analytics.event.cashAmountEntered, { amount: toAnalyticsAmount(presetAmount), entryMode: 'preset' });
    },
    [displayedAmount, setAmount]
  );

  const onKeypadAmountChange = useCallback(
    (nextAmount: string) => {
      setAmount(nextAmount);
      if (!isSubmittableCashAmount(nextAmount)) return;
      analytics.track(analytics.event.cashAmountEntered, { amount: toAnalyticsAmount(nextAmount), entryMode: 'keypad' });
    },
    [setAmount]
  );

  const onValueChange = useCallback(
    (_fieldId: CashFieldId, newValue: string | number) => {
      'worklet';
      const nextAmount = String(newValue);
      displayedAmount.value = nextAmount;
      runOnJS(onKeypadAmountChange)(nextAmount);
    },
    [displayedAmount, onKeypadAmountChange]
  );

  const onBeforeChange = useCallback<NonNullable<NumberPadProps<CashFieldId>['onBeforeChange']>>(
    (_fieldId, currentValue, newValue, key) => {
      'worklet';
      return { isValid: isValidCashAmountChange(currentValue, newValue, key) };
    },
    []
  );

  const onInputRejected = useCallback(() => {
    'worklet';
    shake('notificationWarning');
  }, [shake]);

  const resetKeypadAmount = useCallback(() => {
    setAmount(ADD_CASH_DEFAULT_VALUE);
    displayedAmount.value = ADD_CASH_DEFAULT_VALUE;
    fields.modify(current => {
      'worklet';
      current[ADD_CASH_AMOUNT_FIELD_ID].value = ADD_CASH_DEFAULT_VALUE;
      return current;
    });
  }, [displayedAmount, fields, setAmount]);

  return {
    activeFieldId,
    displayedAmount,
    fields,
    onBeforeChange,
    onInputRejected,
    onValueChange,
    resetKeypadAmount,
    selectPresetAmount,
    shakeOffset,
    useAddCashStore: addCashStore,
  };
}

function createAddCashStore(defaultPresetAmount: number): Store<AddCashStoreState> {
  return createBaseStore((set, get) => ({
    amount: String(defaultPresetAmount),
    canSubmit: () => isSubmittableCashAmount(get().amount),
    getSelectedAmountPreset: () => Number(get().amount),
    setAmount: amount => set(state => (state.amount === amount ? state : { amount })),
  }));
}
