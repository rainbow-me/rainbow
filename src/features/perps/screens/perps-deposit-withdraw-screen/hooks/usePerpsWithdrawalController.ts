import { useCallback } from 'react';
import { runOnUI, useAnimatedReaction, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { SLIDER_MAX } from '@/features/perps/components/Slider/Slider';
import { USD_DECIMALS } from '@/features/perps/constants';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { equalWorklet, greaterThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { sanitizeAmount } from '@/worklets/strings';
import { valueFromSliderProgress, sliderProgressFromAmount } from '../shared/worklets';
import { INITIAL_SLIDER_PROGRESS } from '../shared/constants';
import { InteractionSource } from '../shared/types';

type InputMethod = 'inputAmount';

export function usePerpsWithdrawalController() {
  const balance = useStoreSharedValue(useHyperliquidAccountStore, state => state.getBalance());
  const initial = getInitialValues();

  const sliderProgress = useSharedValue(INITIAL_SLIDER_PROGRESS);
  const interactionSource = useSharedValue<InteractionSource>('slider');
  const inputMethod = useSharedValue('inputAmount');
  const displayedAmount = useSharedValue(initial.initialAmount);
  const fields = useSharedValue<Record<InputMethod, NumberPadField>>(initial.fields);

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

      const newAmount = valueFromSliderProgress(current.progress, current.balance, USD_DECIMALS);
      displayedAmount.value = newAmount;

      fields.modify(prev => {
        prev.inputAmount.value = newAmount;
        return prev;
      });
    },
    []
  );

  const handleSliderBeginWorklet = useCallback(() => {
    'worklet';
    interactionSource.value = 'slider';
  }, [interactionSource]);

  const handleNumberPadChange = useCallback(
    (_: string, newValue: string | number) => {
      'worklet';
      interactionSource.value = 'numberpad';
      const amount = String(newValue);
      displayedAmount.value = amount;

      fields.modify(prev => {
        prev.inputAmount.value = amount;
        return prev;
      });

      const sanitizedAmount = sanitizeAmount(amount);
      const nextProgress = sliderProgressFromAmount(sanitizedAmount, balance.value);
      sliderProgress.value = withSpring(nextProgress, SPRING_CONFIGS.snappySpringConfig);
    },
    [balance, displayedAmount, fields, interactionSource, sliderProgress]
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
    useHyperliquidAccountStore,
    state => state.getBalance(),
    newBalance => {
      runOnUI(() => {
        const resetAmount = valueFromSliderProgress(sliderProgress.value, newBalance, USD_DECIMALS);
        displayedAmount.value = resetAmount;
        fields.modify(prev => {
          prev.inputAmount.value = resetAmount;
          return prev;
        });
      })();
    }
  );

  return {
    displayedAmount,
    fields,
    handleNumberPadChange,
    handlePressMaxWorklet,
    handleSliderBeginWorklet,
    inputMethod,
    interactionSource,
    sliderProgress,
  };
}

function getInitialValues(): {
  fields: Record<InputMethod, NumberPadField>;
  initialAmount: string;
} {
  const initialAmount = sanitizeAmount(
    valueFromSliderProgress(INITIAL_SLIDER_PROGRESS, hyperliquidAccountActions.getBalance(), USD_DECIMALS)
  );
  return {
    fields: {
      inputAmount: {
        allowDecimals: true,
        id: 'inputAmount',
        maxDecimals: USD_DECIMALS,
        value: initialAmount,
      },
    },
    initialAmount,
  };
}
