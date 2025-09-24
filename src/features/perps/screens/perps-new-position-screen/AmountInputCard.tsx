import React, { memo, useCallback, useRef } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { SLIDER_WIDTH, SLIDER_HEIGHT, SLIDER_EXPANDED_HEIGHT, INPUT_CARD_HEIGHT } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { runOnJS, runOnUI, SharedValue, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Slider } from '@/features/perps/components/Slider';
import { addCommasToNumber, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { CurrencyInput, CurrencyInputRef } from '@/components/CurrencyInput';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import { divide } from '@/helpers/utilities';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { useStableValue } from '@/hooks/useStableValue';
import { useListen } from '@/state/internal/hooks/useListen';
import * as i18n from '@/languages';

const AmountSlider = ({
  sliderXPosition,
  onPercentageUpdate,
  onPercentageChange,
}: {
  sliderXPosition: SharedValue<number>;
  onPercentageUpdate?: (percentage: number) => void;
  onPercentageChange: (percentage: number) => void;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      sliderXPosition={sliderXPosition}
      colors={accentColors.slider}
      onPercentageUpdate={onPercentageUpdate}
      onPercentageChange={onPercentageChange}
      width={SLIDER_WIDTH}
      height={SLIDER_HEIGHT}
      expandedHeight={SLIDER_EXPANDED_HEIGHT}
    />
  );
};

function formatInput(text: string) {
  'worklet';
  const cleanedText = text.replace(/[^0-9.]/g, '');

  if (!cleanedText) return '';

  // Handle multiple decimals - keep only the first one
  const parts = cleanedText.split('.');
  let formattedText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanedText;

  // Handle decimal point
  if (formattedText.includes('.')) {
    const [intPart, decPart] = formattedText.split('.');
    // Allow empty integer part (will be displayed as "0.")
    const cleanedInt = intPart === '' ? '0' : intPart.replace(/^0+/, '') || '0';
    // Limit decimal places to 2
    const truncatedDecPart = decPart.slice(0, 2);
    formattedText = `${cleanedInt}.${truncatedDecPart}`;
  } else {
    // No decimal point - only strip leading zeros if there's more than one character
    // This allows "0" to remain but "00" becomes "0", "05" becomes "5"
    if (formattedText.length > 1) {
      formattedText = formattedText.replace(/^0+/, '') || '0';
    }
  }

  return formattedText;
}

function formatDisplay(value: string) {
  'worklet';
  const numericValue = stripNonDecimalNumbers(value);
  if (!numericValue || numericValue === '0') {
    return '$0';
  }
  return `$${addCommasToNumber(numericValue, '0')}`;
}

export const AmountInputCard = memo(function AmountInputCard() {
  const { isDarkMode } = useColorMode();
  const inputRef = useRef<CurrencyInputRef>(null);
  const { accentColors } = usePerpsAccentColorContext();

  const availableBalanceString = useHyperliquidAccountStore(state => state.getBalance());
  const initialValues = useStableValue(() => getInitialValues(availableBalanceString));

  const availableBalance = Number(availableBalanceString);
  const sliderXPosition = useSharedValue(initialValues.sliderXPosition);
  const ignoreSliderUpdates = useSharedValue(false);
  const inputValue = useSharedValue(initialValues.initialAmount);
  const isInputFocused = useSharedValue(false);

  const amountText = useDerivedValue(() => {
    const currentInputValue = inputValue.value;
    if (isInputFocused.value || Number(currentInputValue) > availableBalance) return currentInputValue;
    const amount = availableBalance * (sliderXPosition.value / SLIDER_WIDTH);
    const formattedAmount = formatInput(amount.toString());
    return formattedAmount;
  });

  const onBlur = useCallback(() => (isInputFocused.value = false), [isInputFocused]);
  const onFocus = useCallback(() => (isInputFocused.value = true), [isInputFocused]);
  const setInputValue = useCallback((value: string) => inputRef.current?.setValue(value), [inputRef]);
  const setAmount = hlNewPositionStoreActions.setAmount;

  const onNewInputValue = useCallback(
    (value: string) => {
      'worklet';
      if (!isInputFocused.value) return;
      const amount = Number(value) || 0;
      const percentage = availableBalance > 0 ? Math.min(amount / availableBalance, 1) : 0;
      const newSliderX = percentage * SLIDER_WIDTH;
      inputValue.value = value;
      sliderXPosition.value = withSpring(newSliderX, SPRING_CONFIGS.snappySpringConfig);
      runOnJS(setAmount)(value);
    },
    [availableBalance, isInputFocused, inputValue, sliderXPosition, setAmount]
  );

  // Called when gesture ends
  const onPercentageChange = useCallback(
    (percentage: number) => {
      'worklet';
      if (ignoreSliderUpdates.value) return;
      const amount = availableBalance * percentage;
      const formattedAmount = formatInput(amount.toString());
      inputValue.value = formattedAmount;
      runOnJS(setInputValue)(formattedAmount);
      runOnJS(setAmount)(formattedAmount);
    },
    [availableBalance, ignoreSliderUpdates, inputValue, setAmount, setInputValue]
  );

  const revalidateInputAmount = useCallback(
    (balanceString: string) => {
      runOnUI(() => {
        const balance = Number(stripNonDecimalNumbers(balanceString));
        const inputValueExceedsBalance = Number(stripNonDecimalNumbers(inputValue.value)) > balance;
        if (!inputValueExceedsBalance) return;

        const formattedBalanceString = formatInput(balanceString);
        ignoreSliderUpdates.value = true;
        runOnJS(setInputValue)(formattedBalanceString);
        inputValue.value = formattedBalanceString;
        sliderXPosition.value = withSpring(SLIDER_WIDTH, SPRING_CONFIGS.snappySpringConfig, () => {
          ignoreSliderUpdates.value = false;
        });
      })();
    },
    [ignoreSliderUpdates, inputValue, setInputValue, sliderXPosition]
  );

  useListen(useHyperliquidAccountStore, state => state.getBalance(), revalidateInputAmount);

  useListen(
    useHlNewPositionStore,
    state => state.amountResetSignal,
    () => revalidateInputAmount(availableBalanceString)
  );

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
            {i18n.t(i18n.l.perps.inputs.amount)}
          </Text>
          <Text size="15pt" weight="heavy" color="labelSecondary">
            {formatCurrency(truncateToDecimals(availableBalanceString, 2))}
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {` ${i18n.t(i18n.l.perps.inputs.available)}`}
            </Text>
          </Text>
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
          <CurrencyInput
            ref={inputRef}
            value={amountText}
            textColor={accentColors.opacity100}
            placeholderTextColor={accentColors.opacity24}
            formatInput={formatInput}
            formatDisplay={formatDisplay}
            onBlur={onBlur}
            onChangeValue={onNewInputValue}
            onFocus={onFocus}
            size="30pt"
            weight="heavy"
            align="right"
            style={{ width: 200 }}
          />
        </Box>
      </Box>
      <AmountSlider sliderXPosition={sliderXPosition} onPercentageChange={onPercentageChange} />
    </Box>
  );
});

function getInitialValues(availableBalanceString: string): { initialAmount: string; sliderXPosition: number } {
  const availableBalance = Number(availableBalanceString);
  const shouldUseMax = availableBalance <= 5;
  const sliderXPosition = shouldUseMax ? SLIDER_WIDTH : 0.5 * SLIDER_WIDTH;
  const initialAmount = formatInput(formatDisplay(shouldUseMax ? availableBalanceString : divide(availableBalanceString, 2)));
  return { initialAmount, sliderXPosition };
}
