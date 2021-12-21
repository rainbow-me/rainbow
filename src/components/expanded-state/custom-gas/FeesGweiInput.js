import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import styled from '@terrysahaidak/style-thing';
import { ButtonPressAnimation } from '../../animations';
import { Row } from '../../layout';
import { Text } from '../../text';
import GweiInputPill from './GweiInputPill';
import { delay } from '@rainbow-me/helpers/utilities';
import { usePrevious } from '@rainbow-me/hooks';

const PLUS_ACTION_TYPE = 'plus';
const MINUS_ACTION_TYPE = 'minus';
const DELAY_THRESHOLD = 69;

const Wrapper = styled(Row)({});

const StepButtonWrapper = styled(ButtonPressAnimation).attrs(() => ({
  paddingHorizontal: 7,
  scaleTo: 0.75,
}))({});

const StepButton = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  lineHeight: 40,
  size: 'lmedium',
  weight: 'heavy',
}))({});

const GweiStepButton = ({
  type,
  onLongPress,
  onLongPressEnded,
  onPress,
  shouldLongPressEndPress,
  buttonColor,
}) => {
  return (
    <StepButtonWrapper
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPressStart={onPress}
      shouldLongPressEndPress={shouldLongPressEndPress}
      useLateHaptic={false}
    >
      <StepButton color={buttonColor}>{type === 'plus' ? '􀁍' : '􀁏'}</StepButton>
    </StepButtonWrapper>
  );
};

export default function FeesGweiInput({
  value,
  plusAction,
  minusAction,
  onChange,
  onPress,
  onBlur,
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
    await delay(DELAY_THRESHOLD);
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

  const onInputPress = useCallback(() => {
    inputRef?.current?.focus();
    onPress?.();
  }, [inputRef, onPress]);

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
      <GweiStepButton
        buttonColor={buttonColor}
        onLongPress={onMinusLongPress}
        onLongPressEnded={onLongPressEnded}
        onPress={onMinusPress}
        shouldLongPressEndPress
        type={MINUS_ACTION_TYPE}
      />
      <GweiInputPill
        color={buttonColor}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onInputPress}
        onPress={onInputPress}
        ref={inputRef}
        testID={testID}
        value={value}
      />
      <GweiStepButton
        buttonColor={buttonColor}
        onLongPress={onPlusLongPress}
        onLongPressEnded={onLongPressEnded}
        onPress={onPlusPress}
        shouldLongPressEndPress
        type={PLUS_ACTION_TYPE}
      />
    </Wrapper>
  );
}
