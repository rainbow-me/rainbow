import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { ButtonPressAnimation } from '../../animations';
import { Row } from '../../layout';
import { Text } from '../../text';
import InputPill from './InputPill';
import { delay } from '@/helpers/utilities';
import { usePrevious } from '@/hooks';
import styled from '@/styled-thing';

const PLUS_ACTION_TYPE = 'plus';
const MINUS_ACTION_TYPE = 'minus';
const LONG_PRESS_DELAY_THRESHOLD = 69;
const MIN_LONG_PRESS_DELAY_THRESHOLD = 200;

const Wrapper = styled(Row)({});

const StepButtonWrapper = styled(ButtonPressAnimation).attrs(() => ({
  paddingHorizontal: 7,
  scaleTo: 0.75,
}))({});

const StepButtonText = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  lineHeight: 40,
  size: 'lmedium',
  weight: 'heavy',
}))({});

const StepButton = ({ type, onLongPress, onLongPressEnded, onPress, shouldLongPressHoldPress, buttonColor }) => {
  return (
    <StepButtonWrapper
      minLongPressDuration={MIN_LONG_PRESS_DELAY_THRESHOLD}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      useLateHaptic={false}
    >
      <StepButtonText color={buttonColor}>{type === 'plus' ? '􀁍' : '􀁏'}</StepButtonText>
    </StepButtonWrapper>
  );
};

export default function StepButtonInput({
  value,
  inputLabel,
  plusAction,
  minusAction,
  onBlur,
  onChange,
  onFocus,
  buttonColor,
  testID,
  inputRef,
}) {
  const longPressHandle = useRef(null);
  const [trigger, setTrigger] = useState(false);
  const [actionType, setActionType] = useState(null);
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
      <StepButton
        buttonColor={buttonColor}
        onLongPress={onMinusLongPress}
        onLongPressEnded={onLongPressEnded}
        onPress={onMinusPress}
        shouldLongPressHoldPress
        type={MINUS_ACTION_TYPE}
      />
      <InputPill
        color={buttonColor}
        label={inputLabel}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        ref={inputRef}
        testID={`${testID}-${value}`}
        value={value}
      />
      <StepButton
        buttonColor={buttonColor}
        onLongPress={onPlusLongPress}
        onLongPressEnded={onLongPressEnded}
        onPress={onPlusPress}
        shouldLongPressHoldPress
        type={PLUS_ACTION_TYPE}
      />
    </Wrapper>
  );
}
