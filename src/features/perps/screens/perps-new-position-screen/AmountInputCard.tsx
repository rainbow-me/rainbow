import React, { memo, useCallback, useRef } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { SLIDER_WIDTH, SLIDER_HEIGHT, SLIDER_EXPANDED_HEIGHT, INPUT_CARD_HEIGHT } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { runOnJS, SharedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Slider } from '@/features/perps/components/Slider';
import { addCommasToNumber, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { CurrencyInput, CurrencyInputRef } from '@/components/CurrencyInput';
import { hlNewPositionStoreActions } from '@/features/perps/stores/hlNewPositionStore';
import { divide } from '@/helpers/utilities';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';

const AmountSlider = ({
  sliderXPosition,
  onPercentageUpdate,
  onPercentageChange,
}: {
  sliderXPosition: SharedValue<number>;
  onPercentageUpdate: (percentage: number) => void;
  onPercentageChange: (percentage: number) => void;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      sliderXPosition={sliderXPosition}
      colors={accentColors.slider}
      onPercentageUpdate={onPercentageUpdate}
      onPercentageChange={onPercentageChange}
      snapPoints={[0, 0.25, 0.5, 0.75, 1]}
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
  const availableBalanceString = useHyperliquidAccountStore(state => state.balance);
  const availableBalance = Number(availableBalanceString);
  const sliderXPosition = useSharedValue(0.5 * SLIDER_WIDTH);
  const initialAmount = formatInput(formatDisplay(divide(availableBalanceString, 2)));
  const inputValue = useSharedValue(initialAmount);

  const setAmount = useCallback((amount: string) => {
    hlNewPositionStoreActions.setAmount(amount);
  }, []);

  const onChangeValue = useCallback(
    (value: string) => {
      'worklet';
      const amount = Number(value) || 0;
      const percentage = availableBalance > 0 ? amount / availableBalance : 0;
      const newSliderX = percentage * SLIDER_WIDTH;
      sliderXPosition.value = withSpring(newSliderX, SPRING_CONFIGS.sliderConfig);
      runOnJS(setAmount)(value);
    },
    [availableBalance, sliderXPosition, setAmount]
  );

  // Called when gesture ends
  const onPercentageChange = useCallback(
    (percentage: number) => {
      const amount = availableBalance * percentage;
      const formattedAmount = formatInput(amount.toString());
      if (inputRef.current) {
        inputRef.current.setValue(formattedAmount);
      }
      setAmount(formattedAmount);
    },
    [availableBalance, setAmount]
  );

  const onPercentageUpdate = useCallback(
    (percentage: number) => {
      'worklet';
      const amount = availableBalance * percentage;
      const formattedAmount = formatInput(amount.toString());
      inputValue.value = formattedAmount;
    },
    [availableBalance, inputValue]
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
      <Box width="full" flexDirection="row" alignItems="center">
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {'Amount'}
          </Text>
          <Text size="15pt" weight="heavy" color="labelSecondary">
            {formatCurrency(availableBalanceString)}
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {' Available'}
            </Text>
          </Text>
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
          <CurrencyInput
            ref={inputRef}
            value={inputValue}
            textColor={accentColors.opacity100}
            placeholderTextColor={accentColors.opacity24}
            formatInput={formatInput}
            formatDisplay={formatDisplay}
            onChangeValue={onChangeValue}
            size="30pt"
            weight="bold"
            align="right"
            style={{ width: 200 }}
          />
        </Box>
      </Box>
      <AmountSlider sliderXPosition={sliderXPosition} onPercentageChange={onPercentageChange} onPercentageUpdate={onPercentageUpdate} />
    </Box>
  );
});
