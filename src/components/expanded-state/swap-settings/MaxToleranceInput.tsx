import lang from 'i18n-js';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { Icon } from '../../icons';
import StepButtonInput from './StepButtonInput';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inline,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  add,
  greaterThan,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import {
  useMagicAutofocus,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapSettings,
} from '@rainbow-me/hooks';
import { AppState } from '@rainbow-me/redux/store';

const convertBipsToPercent = (bips: number) => (bips / 100).toString();
const convertPercentToBips = (percent: number) => (percent * 100).toString();

const SLIPPAGE_INCREMENT = 0.1;

export const MaxToleranceInput: React.FC<{
  colorForAsset: string;
}> = forwardRef(({ colorForAsset }, ref) => {
  const { slippageInBips, updateSwapSlippage } = useSwapSettings();
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

  const { handleFocus } = useMagicAutofocus(slippageRef, undefined, true);

  useImperativeHandle(ref, () => ({
    blur: () => {
      slippageRef?.current?.blur();
    },
    reset: () => {
      onSlippageChange(1);
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

  const updateSlippage = useCallback(
    increment => {
      const newSlippage = add(slippageValue, increment);
      const newSlippageValue = toFixedDecimals(newSlippage, 2);
      if (greaterThan(0, newSlippageValue)) return;

      updateSwapSlippage(convertPercentToBips(parseInt(newSlippageValue)));
      setSlippageValue(newSlippageValue);
    },
    [slippageValue, updateSwapSlippage]
  );

  const addSlippage = useCallback(() => {
    updateSlippage(SLIPPAGE_INCREMENT);
  }, [updateSlippage]);

  const minusSlippage = useCallback(() => {
    updateSlippage(-SLIPPAGE_INCREMENT);
  }, [updateSlippage]);

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
      <Stack space="10px">
        <Inline alignVertical="center" space="2px">
          <Text size="18px" weight="bold">
            {`${lang.t('exchange.slippage_tolerance')} `}
          </Text>
          {hasPriceImpact && (
            <Box paddingTop={android ? '2px' : '1px'}>
              <Icon color={priceImpactColor} name="warning" size={18} />
            </Box>
          )}
        </Inline>
        {hasPriceImpact && (
          <Box>
            <Text size={android ? '12px' : '14px'}>
              <AccentColorProvider color={priceImpactColor!}>
                <Text
                  color="accent"
                  size={android ? '12px' : '14px'}
                  weight="bold"
                >
                  {lang.t('exchange.high')}
                </Text>
              </AccentColorProvider>
              <Text
                color="secondary50"
                size={android ? '12px' : '14px'}
                weight="bold"
              >{` · ${lang.t(
                'exchange.losing'
              )} ${priceImpactNativeAmount}`}</Text>
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
          onBlur={null}
          onChange={onSlippageChange}
          onFocus={handleFocus}
          plusAction={addSlippage}
          testID="swap-slippage-input"
          value={slippageValue}
        />
      </Column>
    </Columns>
  );
});
