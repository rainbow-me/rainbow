import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { Box, Text, useColorMode } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import {
  INPUT_CARD_HEIGHT,
  SLIDER_EXPANDED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  USD_CURRENCY,
  USD_DECIMALS,
} from '@/features/perps/constants';
import { Slider, SliderChangeSource, SliderGestureState } from '@/features/perps/components/Slider';
import { SLIDER_DEFAULT_SNAP_POINTS, SLIDER_MAX, SLIDER_MIN } from '@/features/perps/components/Slider/Slider';
import { CurrencyInput, CurrencyInputRef } from '@/components/CurrencyInput';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { addCommasToNumber, clamp, trimCurrencyZeros } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import { useDebouncedCallback } from 'use-debounce';
import { triggerHaptics } from 'react-native-turbo-haptics';
import {
  equalWorklet,
  mulWorklet,
  toFixedWorklet,
  divWorklet,
  greaterThanWorklet,
  greaterThanOrEqualToWorklet,
} from '@/safe-math/SafeMath';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { sanitizeAmount } from '@/worklets/strings';
import * as i18n from '@/languages';
import { ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { AmountInputCardSubtitle } from '@/features/perps/screens/perps-new-position-screen/AmountInputCardSubtitle';
import { OrderAmountValidation } from '@/features/perps/utils/buildOrderAmountValidation';

type InteractionMode = 'slider' | 'keyboard';

const AmountSlider = ({
  progressValue,
  gestureState,
  isEnabled,
  onGestureBeginWorklet,
  onProgressSettleWorklet,
  onTouchesUpWorklet,
  silenceEdgeHaptics,
  snapPoints,
  width = SLIDER_WIDTH,
}: {
  progressValue: SharedValue<number>;
  gestureState: SharedValue<SliderGestureState>;
  isEnabled?: SharedValue<boolean>;
  onGestureBeginWorklet?: () => void;
  onProgressSettleWorklet?: (progress: number, source: SliderChangeSource) => void;
  onTouchesUpWorklet?: () => void;
  silenceEdgeHaptics?: SharedValue<boolean>;
  snapPoints?: SharedValue<readonly number[]>;
  width?: number;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      colors={accentColors.slider}
      expandedHeight={SLIDER_EXPANDED_HEIGHT}
      height={SLIDER_HEIGHT}
      isEnabled={isEnabled}
      gestureState={gestureState}
      onGestureBeginWorklet={onGestureBeginWorklet}
      onProgressSettleWorklet={onProgressSettleWorklet}
      onTouchesUpWorklet={onTouchesUpWorklet}
      progressValue={progressValue}
      silenceEdgeHaptics={silenceEdgeHaptics}
      snapPoints={snapPoints}
      width={width}
    />
  );
};

function clampSliderProgress(progress: number): number {
  'worklet';
  return clamp(progress, SLIDER_MIN, SLIDER_MAX);
}

function formatInputForEditing(text: string): string {
  'worklet';
  const cleanedText = text.replace(/[^0-9.]/g, '');
  if (!cleanedText) return '';

  const parts = cleanedText.split('.');
  let formattedText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanedText;

  if (formattedText.includes('.')) {
    const [intPart, decPart] = formattedText.split('.');
    const cleanedInt = intPart === '' ? '0' : intPart.replace(/^0+/, '') || '0';
    const truncatedDecPart = decPart.slice(0, 2);
    formattedText = `${cleanedInt}.${truncatedDecPart}`;
  } else if (formattedText.length > 1) {
    formattedText = formattedText.replace(/^0+/, '') || '0';
  }

  return formattedText;
}

function formatAmountForDisplay(value: string): string {
  'worklet';
  const numeric = sanitizeAmount(value);
  if (!numeric || equalWorklet(numeric, '0')) return '$0';

  if (numeric.includes('.')) {
    const [intPart, decPart] = numeric.split('.');
    if (decPart === '') {
      return `$${addCommasToNumber(intPart, '0')}.`;
    } else if (decPart.length === 1) {
      return `$${addCommasToNumber(intPart, '0')}.${decPart}`;
    } else {
      return `$${addCommasToNumber(intPart, '0')}.${decPart.slice(0, 2)}`;
    }
  }
  return `$${addCommasToNumber(numeric, '0')}`;
}

function getAmountFromProgress(progress: number, balance: string): string {
  'worklet';
  if (progress >= SLIDER_MAX) return balance;
  if (equalWorklet(balance, '0')) return '0';

  const percentage = clampSliderProgress(progress) / SLIDER_MAX;
  const product = mulWorklet(balance, percentage);

  return toFixedWorklet(product, USD_DECIMALS);
}

function getProgressFromAmount(amount: string, balance: string): number {
  'worklet';
  if (!greaterThanWorklet(balance, '0')) return 0;
  const sanitizedAmount = sanitizeAmount(amount);
  const ratio = balance === '0' ? 0 : divWorklet(sanitizedAmount, balance);
  return clampSliderProgress(Number(ratio) * SLIDER_MAX);
}

function getInitialProgress(availableBalanceString: string): number {
  'worklet';
  const availableBalance = Number(availableBalanceString);
  if (!availableBalance) return 0;
  return availableBalance <= 5 ? SLIDER_MAX : SLIDER_MAX / 2;
}

function normalizeAmountForStore(value: string): string {
  'worklet';
  const numeric = sanitizeAmount(value);
  if (numeric.endsWith('.')) {
    const trimmed = numeric.slice(0, -1);
    return trimmed === '' ? '0' : trimmed;
  }
  return trimCurrencyZeros(numeric, USD_CURRENCY);
}

function toNiceIncrement(sanitizedAmount: string): string {
  'worklet';
  const amountAsNumber = Number(sanitizedAmount);
  if (amountAsNumber < 100) return toFixedWorklet(sanitizedAmount, USD_DECIMALS);
  if (amountAsNumber < 1000) trimCurrencyZeros(toFixedWorklet(sanitizedAmount, 0), USD_CURRENCY);
  return trimCurrencyZeros(toFixedWorklet(Math.round(amountAsNumber / 10) * 10, 0), USD_CURRENCY);
}

function toAdaptivePrecision(amount: string, availableBalance: string): string {
  'worklet';
  if (equalWorklet(amount, '0')) return '';

  const balance = sanitizeAmount(availableBalance);
  const isMax = greaterThanOrEqualToWorklet(amount, balance);
  if (isMax) return toFixedWorklet(balance, USD_DECIMALS);

  if (amount === balance) return amount;

  return toNiceIncrement(amount);
}

function roundToNearestTenth(value: number): number {
  'worklet';
  return Math.round(value * 10) / 10;
}

function buildInitialValues(availableBalanceString: string, initialAmount?: string) {
  const sanitizedBalance = sanitizeAmount(availableBalanceString) || '0';
  const sanitizedInitial = initialAmount ? sanitizeAmount(initialAmount) : undefined;

  if (sanitizedInitial !== undefined && sanitizedInitial !== '') {
    const clampedProgress = clampSliderProgress(getProgressFromAmount(sanitizedInitial, sanitizedBalance));
    const adaptiveAmount = toAdaptivePrecision(sanitizedInitial, sanitizedBalance);
    const normalized = normalizeAmountForStore(adaptiveAmount);
    return {
      amount: equalWorklet(normalized, '0') ? '' : normalized,
      availableBalance: sanitizedBalance,
      normalizedAmount: normalized,
      sliderProgress: clampedProgress,
    };
  }

  const sliderProgress = getInitialProgress(availableBalanceString);
  const amount = toAdaptivePrecision(getAmountFromProgress(sliderProgress, sanitizedBalance), sanitizedBalance);
  const normalized = normalizeAmountForStore(amount);

  return {
    amount,
    availableBalance: sanitizedBalance,
    normalizedAmount: normalized,
    sliderProgress,
  };
}

type AmountInputCardProps = {
  availableBalance: string;
  initialAmount?: string;
  resetKey?: string | number;
  title?: string;
  validation?: ReadOnlySharedValue<OrderAmountValidation>;
  onAmountChange?: (amount: string) => void;
  snapPoints?: readonly number[];
};

export const AmountInputCard = memo(function AmountInputCard({
  availableBalance,
  initialAmount,
  resetKey,
  title = i18n.t(i18n.l.perps.inputs.amount),
  validation,
  onAmountChange,
  snapPoints = SLIDER_DEFAULT_SNAP_POINTS,
}: AmountInputCardProps) {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const inputRef = useRef<CurrencyInputRef>(null);
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);

  const initialValues = useMemo(() => buildInitialValues(availableBalance, initialAmount), [availableBalance, initialAmount]);

  const balanceValue = useSharedValue(initialValues.availableBalance);
  const displayedAmount = useSharedValue(initialValues.amount);
  const sliderProgress = useSharedValue(initialValues.sliderProgress);
  const inputSource = useSharedValue<InteractionMode>('slider');
  const isInputFocused = useSharedValue(false);
  const sliderGestureState = useSharedValue<SliderGestureState>('idle');
  const isBalanceZero = useDerivedValue(() => {
    'worklet';
    return equalWorklet(balanceValue.value, '0');
  });
  const balanceShared = useDerivedValue(() => {
    'worklet';
    return balanceValue.value;
  });
  const snapPointsValue = useDerivedValue(() => (isBalanceZero.value ? [0] : snapPoints));

  const handleSliderLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (!width) return;
    setSliderWidth(prev => {
      if (Math.abs(prev - width) < StyleSheet.hairlineWidth) return prev;
      return width;
    });
  }, []);

  const setAmount = useCallback(
    (amount: string) => {
      onAmountChange?.(amount);
    },
    [onAmountChange]
  );

  const debouncedSetAmount = useDebouncedCallback(
    (amount: string) => {
      setAmount(amount);
    },
    time.ms(200),
    { leading: false, trailing: true }
  );

  const setTextInput = useCallback(
    (value: string) => {
      inputRef.current?.setValue(value);
    },
    [inputRef]
  );

  const handleSliderBeginWorklet = useCallback(() => {
    'worklet';
    inputSource.value = 'slider';
  }, [inputSource]);

  useAnimatedReaction(
    () => ({
      progress: clampSliderProgress(roundToNearestTenth(sliderProgress.value)),
      source: inputSource.value,
    }),
    (current, previous) => {
      if (previous === null || (current.progress === previous.progress && current.source === previous.source)) return;

      const currentGestureState = sliderGestureState.value;
      const isCurrentSourceSlider = current.source === 'slider';
      const isSliderGestureActive = currentGestureState === 'active';

      if (isSliderGestureActive && !isCurrentSourceSlider) inputSource.value = 'slider';

      const isSliderControlled = isSliderGestureActive || isCurrentSourceSlider;
      if (!isSliderControlled) return;

      const balance = balanceValue.value;
      const amount = toAdaptivePrecision(getAmountFromProgress(current.progress, balance), balance);

      if (displayedAmount.value === amount) return;

      displayedAmount.value = amount;
      const normalized = normalizeAmountForStore(amount);
      runOnJS(debouncedSetAmount)(normalized);
    },
    [balanceValue, debouncedSetAmount, displayedAmount, inputSource, sliderGestureState, sliderProgress]
  );

  const handleKeyboardValueChange = useCallback(
    (value: string) => {
      'worklet';
      inputSource.value = 'keyboard';
      displayedAmount.value = value;

      const normalized = normalizeAmountForStore(value);
      runOnJS(debouncedSetAmount)(normalized);

      const nextProgress = getProgressFromAmount(value, balanceValue.value);
      sliderProgress.value = withSpring(nextProgress, SPRING_CONFIGS.snappySpringConfig);
    },
    [balanceValue, debouncedSetAmount, displayedAmount, inputSource, sliderProgress]
  );

  const handleInputFocus = useCallback(() => {
    'worklet';
    isInputFocused.value = true;
    inputSource.value = 'keyboard';
    runOnJS(setTextInput)(displayedAmount.value);
  }, [displayedAmount, inputSource, isInputFocused, setTextInput]);

  const handleInputBlur = useCallback(() => {
    'worklet';
    isInputFocused.value = false;
    const normalized = normalizeAmountForStore(displayedAmount.value);
    displayedAmount.value = equalWorklet(normalized, '0') ? '' : normalized;
    runOnJS(setAmount)(normalized);
  }, [setAmount, displayedAmount, isInputFocused]);

  const handleSliderTouchesUp = useCallback(() => {
    'worklet';
    if (!equalWorklet(balanceValue.value, '0') || sliderProgress.value <= 0) return;
    inputSource.value = 'slider';
    sliderProgress.value = withSpring(0, SPRING_CONFIGS.snappySpringConfig);
  }, [balanceValue, inputSource, sliderProgress]);

  const handleSliderProgressSettle = useCallback(
    (_: number, source: SliderChangeSource) => {
      'worklet';
      if (equalWorklet(balanceValue.value, '0')) {
        triggerHaptics('notificationError');
        sliderProgress.value = withSpring(0, SPRING_CONFIGS.snappySpringConfig);
        return;
      }

      if (source === 'gesture' || source === 'tap' || source === 'max-button') {
        inputSource.value = 'slider';
        const normalized = normalizeAmountForStore(displayedAmount.value);
        runOnJS(setAmount)(normalized);
      }
    },
    [balanceValue, setAmount, displayedAmount, inputSource, sliderProgress]
  );

  const resetToInitial = useCallback(
    (nextAvailableBalance: string, nextInitialAmount?: string) => {
      const initial = buildInitialValues(nextAvailableBalance, nextInitialAmount);
      const normalized = initial.normalizedAmount;

      runOnUI(() => {
        balanceValue.value = initial.availableBalance;
        displayedAmount.value = equalWorklet(normalized, '0') ? '' : normalized;
        inputSource.value = 'slider';
        sliderProgress.value = initial.sliderProgress;
      })();

      setAmount(normalized);
    },
    [balanceValue, setAmount, displayedAmount, inputSource, sliderProgress]
  );

  const revalidateAmount = useCallback(
    (balanceString: string) => {
      const sanitizedBalance = sanitizeAmount(balanceString);
      runOnUI(() => {
        balanceValue.value = sanitizedBalance;

        const normalizedCurrent = normalizeAmountForStore(displayedAmount.value);
        const exceedsBalance = greaterThanWorklet(normalizedCurrent, sanitizedBalance);

        if (exceedsBalance) {
          inputSource.value = 'slider';
          const hasBalance = !equalWorklet(sanitizedBalance, '0');
          const target = hasBalance ? SLIDER_MAX : 0;
          sliderProgress.value = withSpring(target, SPRING_CONFIGS.snappySpringConfig);
          return;
        }

        const nextProgress = clampSliderProgress(getProgressFromAmount(normalizedCurrent, sanitizedBalance));
        if (Math.abs(sliderProgress.value - nextProgress) > 0.1) {
          sliderProgress.value = withSpring(nextProgress, SPRING_CONFIGS.snappySpringConfig);
        }
      })();
    },
    [balanceValue, displayedAmount, inputSource, sliderProgress]
  );

  useEffect(() => {
    resetToInitial(availableBalance, initialAmount);
  }, [availableBalance, initialAmount, resetKey, resetToInitial]);

  useEffect(() => {
    revalidateAmount(availableBalance);
  }, [availableBalance, revalidateAmount]);

  return (
    <Box
      width="full"
      borderWidth={isDarkMode ? 2 : 0}
      backgroundColor={accentColors.surfacePrimary}
      borderColor={{ custom: accentColors.opacity6 }}
      borderRadius={28}
      padding={'20px'}
      alignItems="center"
      gap={20}
      height={INPUT_CARD_HEIGHT}
      shadow={'18px'}
    >
      <Box width="full" flexDirection="row" alignItems="center" zIndex={2}>
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {title}
          </Text>
          <AmountInputCardSubtitle availableBalanceString={balanceShared} validation={validation} />
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
          <CurrencyInput
            ref={inputRef}
            value={displayedAmount}
            textColor={accentColors.opacity100}
            placeholderTextColor={accentColors.opacity24}
            formatInput={formatInputForEditing}
            formatDisplay={formatAmountForDisplay}
            initialValue={initialValues.amount}
            onBlur={handleInputBlur}
            onChangeValue={handleKeyboardValueChange}
            onFocus={handleInputFocus}
            size="30pt"
            weight="heavy"
            align="right"
            style={{ width: 200 }}
          />
        </Box>
      </Box>
      <Box width="full" onLayout={handleSliderLayout}>
        <AmountSlider
          gestureState={sliderGestureState}
          onGestureBeginWorklet={handleSliderBeginWorklet}
          onProgressSettleWorklet={handleSliderProgressSettle}
          onTouchesUpWorklet={handleSliderTouchesUp}
          progressValue={sliderProgress}
          silenceEdgeHaptics={isBalanceZero}
          snapPoints={snapPointsValue}
          width={sliderWidth}
        />
      </Box>
    </Box>
  );
});
