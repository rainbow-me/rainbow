import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { delay } from '@/utils/delay';
import { usePrevious } from '@/hooks';
import styled from '@/styled-thing';
import { ButtonPressAnimation } from '@/components/animations';
import Row from '@/components/layout/Row';
import { Box, Inline, Text } from '@/design-system';
import { useTheme } from '@/theme';

const PLUS_ACTION_TYPE = 'plus';
const MINUS_ACTION_TYPE = 'minus';
const LONG_PRESS_DELAY_THRESHOLD = 69;
const MIN_LONG_PRESS_DELAY_THRESHOLD = 200;

const Wrapper = styled(Row)({});

const StepButtonWrapper = styled(ButtonPressAnimation).attrs(() => ({
  paddingHorizontal: 7,
  scaleTo: 0.75,
}))({});

type StepButtonProps = {
  type: 'plus' | 'minus';
  onLongPress: () => void;
  onLongPressEnded: () => void;
  onPress: () => void;
  shouldLongPressHoldPress: boolean;
  buttonColor: string;
  disabled?: boolean;
  threshold?: number;
  value: number;
};
const StepButton = ({
  type,
  onLongPress,
  onLongPressEnded,
  onPress,
  shouldLongPressHoldPress,
  buttonColor,
  disabled = false,
  threshold,
  value,
}: StepButtonProps) => {
  const { colors, lightScheme } = useTheme();
  // should prob change the color here maybe :thinky:
  const atThreshold = type === 'plus' ? value === threshold : value === 1;
  const color = disabled || atThreshold ? lightScheme.grey : buttonColor;

  return (
    <StepButtonWrapper
      minLongPressDuration={MIN_LONG_PRESS_DELAY_THRESHOLD}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      useLateHaptic={false}
      disabled={disabled || atThreshold}
    >
      <Box
        alignItems="center"
        justifyContent="center"
        width={{ custom: 36 }}
        height={{ custom: 36 }}
        style={{
          backgroundColor: colors.alpha(color, 0.1),
          borderRadius: 18,
        }}
      >
        <Text align="center" size="17pt" weight="bold" color={{ custom: colors.alpha(color, 0.25) }}>
          {type === 'plus' ? '􀅼' : '􀅽'}
        </Text>
      </Box>
    </StepButtonWrapper>
  );
};

type StepButtonInputProps = {
  value: number;
  plusAction: () => void;
  minusAction: () => void;
  buttonColor: string;
  disabled?: boolean;
  maxValue: number;
};
export function QuantityButton({ value, plusAction, minusAction, buttonColor, disabled = false, maxValue }: StepButtonInputProps) {
  const longPressHandle = useRef<boolean | null>(null);
  const [trigger, setTrigger] = useState(false);
  const [actionType, setActionType] = useState<'plus' | 'minus' | null>(null);
  const prevTrigger = usePrevious(trigger);

  const onMinusPress = useCallback(() => {
    longPressHandle.current = false;
    minusAction();
  }, [minusAction]);

  const onPlusPress = useCallback(() => {
    longPressHandle.current = false;
    plusAction();
  }, [plusAction]);

  const onLongPressEnded = useCallback(() => {
    longPressHandle.current = false;
    setActionType(null);
  }, [longPressHandle]);

  const onLongPressLoop = useCallback(async () => {
    setTrigger(true);
    setTrigger(false);
    await delay(LONG_PRESS_DELAY_THRESHOLD);
    longPressHandle.current && onLongPressLoop();
  }, []);

  const onLongPress = useCallback(async () => {
    longPressHandle.current = true;
    onLongPressLoop();
  }, [onLongPressLoop]);

  const onPlusLongPress = useCallback(() => {
    setActionType(PLUS_ACTION_TYPE);
    onLongPress();
  }, [onLongPress]);

  const onMinusLongPress = useCallback(() => {
    setActionType(MINUS_ACTION_TYPE);
    onLongPress();
  }, [onLongPress]);

  useEffect(() => {
    if (!prevTrigger && trigger) {
      if (actionType === PLUS_ACTION_TYPE) {
        plusAction();
        if (!android) {
          ReactNativeHapticFeedback.trigger('selection');
        }
      } else if (actionType === MINUS_ACTION_TYPE) {
        minusAction();
        if (!android) {
          ReactNativeHapticFeedback.trigger('selection');
        }
      }
    }
  }, [trigger, prevTrigger, actionType, plusAction, minusAction]);

  return (
    <Wrapper>
      <Inline alignHorizontal="center" alignVertical="center" horizontalSpace={'6px'}>
        <StepButton
          buttonColor={buttonColor}
          onLongPress={onMinusLongPress}
          onLongPressEnded={onLongPressEnded}
          onPress={onMinusPress}
          shouldLongPressHoldPress
          type={MINUS_ACTION_TYPE}
          disabled={disabled}
          value={value}
        />
        <Text color="label" align="center" size="22pt" weight="bold" tabularNumbers={true}>
          {value}
        </Text>
        <StepButton
          buttonColor={buttonColor}
          onLongPress={onPlusLongPress}
          onLongPressEnded={onLongPressEnded}
          onPress={onPlusPress}
          shouldLongPressHoldPress
          type={PLUS_ACTION_TYPE}
          disabled={disabled}
          threshold={maxValue}
          value={value}
        />
      </Inline>
    </Wrapper>
  );
}
