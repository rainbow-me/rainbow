import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { InteractionManager } from 'react-native';
import StepButtonInput from './StepButtonInput';
import lang from 'i18n-js';
import {
  add,
  greaterThan,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import {
  usePriceImpactDetails,
  useSwapSlippage,
  useSwapCurrencies,
} from '@rainbow-me/hooks';
import {
  Box,
  Column,
  Columns,
  Stack,
  Text as StyledText,
} from '@rainbow-me/design-system';
import { AppState } from '@rainbow-me/redux/store';
import { Text } from '../../text';
import { Icon } from '../../icons';

const convertBipsToPercent = (bips: number) => (bips / 100).toString();
const convertPercentToBips = (percent: number) => (percent * 100).toString();

export const MaxToleranceInput: React.FC<{
  colorForAsset: string;
}> = forwardRef(({ colorForAsset }, ref) => {
  const { slippageInBips, updateSwapSlippage } = useSwapSlippage();
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const [slippageValue, setSlippageValue] = useState(
    convertBipsToPercent(slippageInBips)
  );

  const { derivedValues } = useSelector((state: AppState) => state.swap);

  const { inputAmount, outputAmount } = derivedValues ?? {
    inputAmount: 0,
    outputAmount: 0,
  };
  const slippageRef = useRef<{ blur: () => void; focus: () => void }>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onSlippageChange(1);
    },
    blur: () => {
      slippageRef?.current?.blur();
    },
  }));

  const {
    isHighPriceImpact,
    isSeverePriceImpact,
    priceImpactColor,
    priceImpactNativeAmount,
  } = usePriceImpactDetails(
    inputAmount,
    outputAmount,
    inputCurrency,
    outputCurrency
  );

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        slippageRef?.current?.focus();
      }, 200);
    });
  }, []);

  const updateSlippage = useCallback(
    increment => {
      const newSlippage = add(slippageValue, increment);
      const newSlippageValue = toFixedDecimals(newSlippage, 2);
      if (greaterThan(0, newSlippageValue)) return;

      updateSwapSlippage(
        convertPercentToBips((newSlippageValue as unknown) as number)
      );
      setSlippageValue(newSlippageValue);
    },
    [slippageValue, updateSwapSlippage]
  );

  const SLIPPAGE_INCREMENT = 0.1;
  const addSlippage = useCallback(() => {
    updateSlippage(SLIPPAGE_INCREMENT);
  }, [updateSlippage]);

  const minusSlippage = useCallback(() => {
    updateSlippage(-SLIPPAGE_INCREMENT);
  }, [updateSlippage]);

  const handleSlippagePress = useCallback(() => slippageRef?.current?.focus(), [
    slippageRef,
  ]);

  const onSlippageChange = useCallback(
    value => {
      updateSwapSlippage(convertPercentToBips(value));
      setSlippageValue(value);
    },
    [updateSwapSlippage, setSlippageValue]
  );

  const hasPriceImpact = isSeverePriceImpact || isHighPriceImpact;

  return (
    <Columns alignVertical="center">
      <Stack space="5px">
        <Box>
          <StyledText size="18px" weight="bold">
            {`${lang.t('exchange.slippage_tolerance')} `}
            {hasPriceImpact && (
              <Icon name="warning" size={18} color={priceImpactColor} />
            )}
          </StyledText>
        </Box>
        {hasPriceImpact && (
          <Box>
            <Text size="14px" weight="bold" color={priceImpactColor}>
              High
              <StyledText
                size="14px"
                weight="bold"
                color="secondary50"
              >{` · Losing ${priceImpactNativeAmount}`}</StyledText>
            </Text>
          </Box>
        )}
      </Stack>
      <Column width="content">
        <StepButtonInput
          buttonColor={colorForAsset}
          inputLabel="%"
          inputRef={slippageRef}
          minusAction={minusSlippage}
          onChange={onSlippageChange}
          onPress={handleSlippagePress}
          onBlur={null}
          plusAction={addSlippage}
          testID="swap-slippage-input"
          value={slippageValue}
        />
      </Column>
    </Columns>
  );
});
