import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import StepButtonInput from './StepButtonInput';
import lang from 'i18n-js';
import {
  add,
  greaterThan,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import { useSwapSlippage } from '@rainbow-me/hooks';
import { Column, Columns, Text } from '@rainbow-me/design-system';

const convertBipsToPercent = bips => bips / 100;
const convertPercentToBips = percent => percent * 100;

export const MaxToleranceInput = forwardRef(({ colorForAsset }, ref) => {
  const { slippageInBips, updateSwapSlippage } = useSwapSlippage();

  const [slippageValue, setSlippageValue] = useState(
    convertBipsToPercent(slippageInBips)
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
  }));

  return (
    <Columns alignVertical="center">
      <Text size="18px" weight="bold">
        {lang.t('exchange.slippage_tolerance')}
      </Text>
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
