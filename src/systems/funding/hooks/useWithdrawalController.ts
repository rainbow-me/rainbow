import { useCallback, useEffect, useRef } from 'react';
import { runOnJS, runOnUI, useAnimatedReaction, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { type NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { SLIDER_MAX } from '@/features/perps/components/Slider/Slider';
import { equalWorklet, greaterThanOrEqualToWorklet } from '@/framework/core/safeMath';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { type RainbowStore } from '@/state/internal/types';
import { type StoreActions } from '@/state/internal/utils/createStoreActions';
import { sanitizeAmount } from '@/worklets/strings';
import { INITIAL_SLIDER_PROGRESS } from '../constants';
import { type AmountStoreType, type InteractionSource } from '../types';
import { sliderProgressFromAmount, valueFromSliderProgress } from '../utils/sliderWorklets';

// ============ Types ========================================================== //

type InputMethod = 'inputAmount';

type BalanceStore = RainbowStore<{ getBalance: () => string }>;

type WithdrawalControllerOptions = {
  amountActions?: StoreActions<AmountStoreType>;
  balanceStore: BalanceStore;
  decimals: number;
};

type WithdrawalControllerReturn = {
  balance: ReturnType<typeof useSharedValue<string>>;
  displayedAmount: ReturnType<typeof useSharedValue<string>>;
  fields: ReturnType<typeof useSharedValue<Record<InputMethod, NumberPadField>>>;
  handleNumberPadChange: (fieldId: string, newValue: number | string) => void;
  handlePressMaxWorklet: () => void;
  handleSliderBeginWorklet: () => void;
  inputMethod: ReturnType<typeof useSharedValue<string>>;
  interactionSource: ReturnType<typeof useSharedValue<InteractionSource>>;
  isAtMax: ReturnType<typeof useSharedValue<boolean>>;
  sliderProgress: ReturnType<typeof useSharedValue<number>>;
};

// ============ Controller Hook ================================================ //

export function useWithdrawalController({
  amountActions,
  balanceStore,
  decimals,
}: WithdrawalControllerOptions): WithdrawalControllerReturn {
  const balance = useStoreSharedValue(balanceStore, state => state.getBalance());
  const initial = getInitialValues(balanceStore, decimals);

  const sliderProgress = useSharedValue(INITIAL_SLIDER_PROGRESS);
  const interactionSource = useSharedValue<InteractionSource>('slider');
  const inputMethod = useSharedValue('inputAmount');
  const displayedAmount = useSharedValue(initial.initialAmount);
  const fields = useSharedValue<Record<InputMethod, NumberPadField>>(initial.fields);
  const isAtMax = useSharedValue(false);

  useAnimatedReaction(
    () => ({
      balance: balance.value,
      progress: sliderProgress.value,
      source: interactionSource.value,
    }),
    (current, previous) => {
      if (previous === null) return;
      if (current.source !== 'slider') return;

      const didSliderProgressChange = current.progress !== previous?.progress;
      const didBalanceChange = current.balance !== previous?.balance;
      const shouldVerifyMax = current.progress >= SLIDER_MAX;

      if (!didSliderProgressChange && !didBalanceChange && !shouldVerifyMax) return;

      const result = valueFromSliderProgress(current.progress, current.balance, decimals);
      displayedAmount.value = result.amount;
      isAtMax.value = result.trueBalance !== undefined;

      fields.modify(prev => {
        prev.inputAmount.value = result.amount;
        return prev;
      });
    },
    []
  );

  // Sync displayed amount to amount store (for quote fetching)
  const syncAmountToStoreRef = useRef<((amount: string) => void) | undefined>(undefined);
  syncAmountToStoreRef.current = amountActions?.setAmount;

  useAnimatedReaction(
    () => displayedAmount.value,
    (currentAmount, previousAmount) => {
      if (currentAmount === previousAmount) return;
      if (syncAmountToStoreRef.current) {
        runOnJS(syncAmountToStoreRef.current)(currentAmount);
      }
    },
    []
  );

  // Initialize amount store with initial value
  useEffect(() => {
    if (amountActions) {
      amountActions.setAmount(initial.initialAmount);
    }
  }, [amountActions, initial.initialAmount]);

  const handleSliderBeginWorklet = useCallback(() => {
    'worklet';
    interactionSource.value = 'slider';
  }, [interactionSource]);

  const handleNumberPadChange = useCallback(
    (_: string, newValue: number | string) => {
      'worklet';
      interactionSource.value = 'numberpad';
      const amount = String(newValue);
      displayedAmount.value = amount;
      isAtMax.value = false;

      fields.modify(prev => {
        prev.inputAmount.value = amount;
        return prev;
      });

      const sanitizedAmount = sanitizeAmount(amount);
      const nextProgress = sliderProgressFromAmount(sanitizedAmount, balance.value);
      sliderProgress.value = withSpring(nextProgress, SPRING_CONFIGS.snappySpringConfig);
    },
    [balance, displayedAmount, fields, interactionSource, isAtMax, sliderProgress]
  );

  const handlePressMaxWorklet = useCallback(() => {
    'worklet';
    const maxAmount = balance.value;
    if (!maxAmount || equalWorklet(maxAmount, 0)) return;

    const currentAmount = displayedAmount.value;
    const isAlreadyMax = equalWorklet(currentAmount, maxAmount);
    const exceedsMax = greaterThanOrEqualToWorklet(currentAmount, maxAmount);

    if (isAlreadyMax) return;
    interactionSource.value = 'slider';

    if (exceedsMax) sliderProgress.value = SLIDER_MAX * 0.999;
    sliderProgress.value = withSpring(SLIDER_MAX, SPRING_CONFIGS.snappySpringConfig);
  }, [balance, displayedAmount, interactionSource, sliderProgress]);

  useListen(
    balanceStore,
    state => state.getBalance(),
    newBalance => {
      runOnUI(() => {
        const result = valueFromSliderProgress(sliderProgress.value, newBalance, decimals);
        displayedAmount.value = result.amount;
        isAtMax.value = result.trueBalance !== undefined;
        fields.modify(prev => {
          prev.inputAmount.value = result.amount;
          return prev;
        });
      })();
    }
  );

  return {
    balance,
    displayedAmount,
    fields,
    handleNumberPadChange,
    handlePressMaxWorklet,
    handleSliderBeginWorklet,
    inputMethod,
    interactionSource,
    isAtMax,
    sliderProgress,
  };
}

// ============ Initial Values ================================================= //

function getInitialValues(
  balanceStore: BalanceStore,
  decimals: number
): {
  fields: Record<InputMethod, NumberPadField>;
  initialAmount: string;
} {
  const result = valueFromSliderProgress(INITIAL_SLIDER_PROGRESS, balanceStore.getState().getBalance(), decimals);
  const initialAmount = sanitizeAmount(result.amount);
  return {
    fields: {
      inputAmount: {
        allowDecimals: true,
        id: 'inputAmount',
        maxDecimals: decimals,
        value: initialAmount,
      },
    },
    initialAmount,
  };
}
