import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';

import {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { useDebouncedCallback } from 'use-debounce';

import { clamp } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { CurrencyInput, type CurrencyInputRef } from '@/components/CurrencyInput/CurrencyInput';
import { Box, Text, useColorMode } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { USD_CURRENCY, USD_DECIMALS } from '@/features/currency/constants';
import { trimCurrencyZeros } from '@/features/currency/utils/nativeDisplay';
import {
  Slider,
  SLIDER_DEFAULT_SNAP_POINTS,
  SLIDER_MAX,
  SLIDER_MIN,
  type SliderChangeSource,
  type SliderGestureState,
} from '@/features/perps/components/Slider/Slider';
import { INPUT_CARD_HEIGHT, SLIDER_EXPANDED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/features/perps/constants';
import { type OrderAmountValidation } from '@/features/perps/utils/buildOrderAmountValidation';
import { divWorklet, equalWorklet, greaterThanWorklet, mulWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { addCommasToNumber } from '@/framework/ui/utils/addCommasToNumber';
import { useLazyRef } from '@/hooks/useLazyRef';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { getAccountAddress } from '@/state/wallets/walletsStore';
import { sanitizeAmount } from '@/worklets/strings';

import { AmountInputCardSubtitle } from './AmountInputCardSubtitle';
import { getInitialSliderAmount } from './getInitialSliderAmount';

type InteractionMode = 'slider' | 'keyboard';

const AmountSlider = ({
  accentColor,
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
  accentColor: string;
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
  const { isDarkMode } = useColorMode();

  const sliderColors = useMemo(
    () => ({
      activeLeft: accentColor,
      inactiveLeft: accentColor,
      activeRight: isDarkMode ? opacity('#F5F8FF', 0.06) : opacity(accentColor, 0.12),
      inactiveRight: isDarkMode ? opacity('#F5F8FF', 0.06) : opacity(accentColor, 0.12),
    }),
    [accentColor, isDarkMode]
  );

  return (
    <Slider
      colors={sliderColors}
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
  const percentage = clampSliderProgress(progress) / SLIDER_MAX;
  const amount = toFixedWorklet(mulWorklet(balance, percentage), USD_DECIMALS);

  return equalWorklet(amount, '0') ? '' : amount;
}

function getProgressFromAmount(amount: string, balance: string): number {
  'worklet';
  if (!greaterThanWorklet(balance, '0')) return 0;
  const sanitizedAmount = sanitizeAmount(amount);
  const ratio = balance === '0' ? 0 : divWorklet(sanitizedAmount, balance);
  return clampSliderProgress(Number(ratio) * SLIDER_MAX);
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

type AmountInputCardProps = {
  availableBalance: string;
  accentColor: string;
  backgroundColor: string;
  onAmountChange?: (amount: string) => void;
  resetKey?: string;
  title?: string;
  validation?: ReadOnlySharedValue<OrderAmountValidation>;
};

export const AmountInputCard = memo(function AmountInputCard({
  availableBalance,
  accentColor,
  backgroundColor,
  onAmountChange,
  resetKey,
  title,
  validation,
}: AmountInputCardProps) {
  const { isDarkMode } = useColorMode();

  const availableBalanceString = useDerivedValue(() => availableBalance);
  const initialValues = useStableValue(() => buildInitialValues(availableBalance));

  const inputRef = useRef<CurrencyInputRef>(null);
  const lastAccountAddress = useLazyRef(() => getAccountAddress());
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);

  const balanceValue = useSharedValue(initialValues.availableBalance);
  const displayedAmount = useSharedValue(initialValues.amount);
  const sliderProgress = useSharedValue(initialValues.sliderProgress);
  const inputSource = useSharedValue<InteractionMode>('slider');
  const isInputFocused = useSharedValue(false);
  const sliderGestureState = useSharedValue<SliderGestureState>('idle');

  const isBalanceZero = useDerivedValue(() => equalWorklet(balanceValue.value, '0'));
  const snapPoints = useDerivedValue(() => (isBalanceZero.value ? [0] : SLIDER_DEFAULT_SNAP_POINTS));

  const debouncedSetAmount = useDebouncedCallback(
    (amount: string) => {
      onAmountChange?.(amount);
    },
    time.ms(200),
    { leading: false, trailing: true }
  );

  const setAmount = useCallback(
    (amount: string) => {
      debouncedSetAmount.cancel();
      onAmountChange?.(amount);
    },
    [debouncedSetAmount, onAmountChange]
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
      progress: clampSliderProgress(sliderProgress.value),
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
      const amount = getAmountFromProgress(current.progress, balance);

      if (displayedAmount.value === amount) return;

      displayedAmount.value = amount;
      const normalized = normalizeAmountForStore(amount);
      runOnJS(debouncedSetAmount)(normalized);
    },
    []
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
  }, [displayedAmount, isInputFocused, setAmount]);

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
    [balanceValue, displayedAmount, inputSource, setAmount, sliderProgress]
  );

  const resetToInitial = useCallback(
    (newAvailableBalance?: string) => {
      'worklet';
      const resetFunction = () => {
        const currentBalance = newAvailableBalance || availableBalanceString.value;
        const values = buildInitialValues(currentBalance);

        balanceValue.value = values.availableBalance;
        displayedAmount.value = values.amount;
        inputSource.value = 'slider';
        sliderProgress.value = values.sliderProgress;
        runOnJS(setAmount)(normalizeAmountForStore(values.amount));
      };
      if (_WORKLET) resetFunction();
      else runOnUI(resetFunction)();
    },
    [availableBalanceString, balanceValue, displayedAmount, inputSource, setAmount, sliderProgress]
  );

  const revalidateAmount = useCallback(
    (balanceString: string) => {
      const accountAddress = getAccountAddress();
      const didAddressChange = lastAccountAddress.current !== accountAddress;
      if (didAddressChange) lastAccountAddress.current = accountAddress;

      runOnUI(() => {
        const nextBalance = sanitizeAmount(balanceString);
        balanceValue.value = nextBalance;

        if (didAddressChange) {
          resetToInitial(nextBalance);
          return;
        }

        const normalizedCurrent = normalizeAmountForStore(displayedAmount.value);
        const exceedsBalance = greaterThanWorklet(normalizedCurrent, nextBalance);

        if (exceedsBalance) {
          const amount = getAmountFromProgress(SLIDER_MAX, nextBalance);
          inputSource.value = 'slider';
          displayedAmount.value = amount;
          runOnJS(setAmount)(normalizeAmountForStore(amount));

          const hasBalance = !equalWorklet(nextBalance, '0');
          sliderProgress.value = withSpring(hasBalance ? SLIDER_MAX : 0, SPRING_CONFIGS.snappySpringConfig);
          return;
        }

        const nextProgress = clampSliderProgress(getProgressFromAmount(normalizedCurrent, nextBalance));
        if (Math.abs(sliderProgress.value - nextProgress) > 0.1) {
          sliderProgress.value = withSpring(nextProgress, SPRING_CONFIGS.snappySpringConfig);
        }
      })();
    },
    [balanceValue, displayedAmount, inputSource, lastAccountAddress, resetToInitial, setAmount, sliderProgress]
  );

  useOnChange(() => {
    resetToInitial();
  }, [resetKey]);

  useOnChange(() => {
    revalidateAmount(availableBalance);
  }, [availableBalance, revalidateAmount]);

  const handleSliderLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (!width) return;
    setSliderWidth(prev => (Math.abs(prev - width) < StyleSheet.hairlineWidth ? prev : width));
  }, []);

  return (
    <Box
      width="full"
      backgroundColor={backgroundColor}
      borderWidth={isDarkMode ? 2 : 0}
      borderColor={{ custom: opacity(accentColor, 0.06) }}
      borderRadius={28}
      padding={'20px'}
      alignItems="center"
      gap={20}
      height={INPUT_CARD_HEIGHT}
    >
      <Box width="full" flexDirection="row" alignItems="center" zIndex={2}>
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColor }}>
            {title ?? i18n.t(i18n.l.perps.inputs.amount)}
          </Text>
          <AmountInputCardSubtitle availableBalanceString={availableBalanceString} validation={validation} />
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
          <CurrencyInput
            ref={inputRef}
            value={displayedAmount}
            textColor={accentColor}
            placeholderTextColor={opacity(accentColor, 0.24)}
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
          accentColor={accentColor}
          gestureState={sliderGestureState}
          onGestureBeginWorklet={handleSliderBeginWorklet}
          onProgressSettleWorklet={handleSliderProgressSettle}
          onTouchesUpWorklet={handleSliderTouchesUp}
          progressValue={sliderProgress}
          silenceEdgeHaptics={isBalanceZero}
          snapPoints={snapPoints}
          width={sliderWidth}
        />
      </Box>
    </Box>
  );
});

function buildInitialValues(availableBalanceString: string): {
  amount: string;
  availableBalance: string;
  sliderProgress: number;
} {
  'worklet';
  const availableBalance = sanitizeAmount(availableBalanceString);
  const amount = getInitialSliderAmount(availableBalance);

  return {
    amount: equalWorklet(amount, '0') ? '' : amount,
    availableBalance,
    sliderProgress: getProgressFromAmount(amount, availableBalance),
  };
}
