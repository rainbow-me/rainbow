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
  Column,
  Columns,
  Row,
  Rows,
  Text as StyledText,
} from '@rainbow-me/design-system';
import { Text } from '../../text';
import { Icon } from '../../icons';

const convertBipsToPercent = bips => bips / 100;
const convertPercentToBips = percent => percent * 100;

export const MaxToleranceInput = forwardRef(({ colorForAsset }, ref) => {
  const { slippageInBips, updateSwapSlippage } = useSwapSlippage();
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const [slippageValue, setSlippageValue] = useState(
    convertBipsToPercent(slippageInBips)
  );

  const { derivedValues } = useSelector(state => state.swap);

  const { inputAmount, outputAmount } = derivedValues ?? {
    inputAmount: 0,
    outputAmount: 0,
  };

  const {
    isHighPriceImpact,
    isSeverePriceImpact,
    priceImpactColor,
    priceImpactNativeAmount,
    outputPriceValue,
  } = usePriceImpactDetails(
    inputAmount,
    outputAmount,
    inputCurrency,
    outputCurrency
  );

  const hasPriceImpact = isSeverePriceImpact || isHighPriceImpact || true;

  console.log(
    'isHighPriceImpact',
    isHighPriceImpact,
    'isSeverePriceImpact',
    isSeverePriceImpact,
    'color',
    priceImpactColor,
    'price value',
    priceImpactNativeAmount
  );

  const slippageRef = useRef(null);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        slippageRef?.current.focus();
      }, 200);
    });
  }, []);

  const updateSlippage = useCallback(
    increment => {
      //setLastFocusedInputHandle(maxBaseFieldRef)
      const newSlippageValue = toFixedDecimals(
        add(slippageValue, increment),
        2
      );
      if (greaterThan(0, newSlippageValue)) return;

      updateSwapSlippage(convertPercentToBips(newSlippageValue));
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

  useImperativeHandle(ref, () => ({
    reset: () => {
      onSlippageChange(1);
    },
    blur: () => {
      slippageRef?.current?.blur();
    },
  }));

  return (
    <Columns alignVertical="center">
      <Rows alignVertical="center">
        <Row>
          <StyledText size="18px" weight="bold">
            {`${lang.t('exchange.slippage_tolerance')} `}
            {hasPriceImpact && (
              <Icon name="warning" size={8} color={priceImpactColor} />
            )}
          </StyledText>
        </Row>
        {hasPriceImpact && (
          <Row>
            <Text size="14px" weight="bold" color={priceImpactColor}>
              High
              <StyledText
                size="14px"
                weight="bold"
                color="secondary50"
              >{` · Losing ${priceImpactNativeAmount}`}</StyledText>
            </Text>
          </Row>
        )}
      </Rows>
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
