import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Row } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './GweiInputPill' was resolved to '/Users/n... Remove this comment to see the full error message
import GweiInputPill from './GweiInputPill';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { delay } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { usePrevious } from '@rainbow-me/hooks';

const PLUS_ACTION_TYPE = 'plus';
const MINUS_ACTION_TYPE = 'minus';
const DELAY_THRESHOLD = 69;

const Wrapper = styled(Row)``;

const StepButtonWrapper = styled(ButtonPressAnimation).attrs(() => ({
  marginHorizontal: -3,
  paddingHorizontal: 3,
}))``;

const StepButton = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  lineHeight: 40,
  size: 'lmedium',
  weight: 'heavy',
}))``;

const GweiStepButton = ({
  type,
  onLongPress,
  onLongPressEnded,
  onPress,
  shouldLongPressEndPress,
  buttonColor,
}: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPressStart={onPress}
      shouldLongPressEndPress={shouldLongPressEndPress}
      useLateHaptic={false}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
}: any) {
  const inputRef = useRef(null);
  const longPressHandle = useRef(null);
  const [trigger, setTrigger] = useState(false);
  const [actionType, setActionType] = useState(null);
  const prevTrigger = usePrevious(trigger);

  const onMinusPress = useCallback(() => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'null'.
    longPressHandle.current = false;
    minusAction();
  }, [minusAction]);

  const onPlusPress = useCallback(() => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'null'.
    longPressHandle.current = false;
    plusAction();
  }, [plusAction]);

  const onLongPressEnded = useCallback(() => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'null'.
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
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'null'.
    longPressHandle.current = true;
    onLongPressLoop();
  }, [onLongPressLoop]);

  const onPlusLongPress = useCallback(() => {
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"plus"' is not assignable to par... Remove this comment to see the full error message
    setActionType(PLUS_ACTION_TYPE);
    onLongPress();
  }, [onLongPress]);

  const onMinusLongPress = useCallback(() => {
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"minus"' is not assignable to pa... Remove this comment to see the full error message
    setActionType(MINUS_ACTION_TYPE);
    onLongPress();
  }, [onLongPress]);

  const onInputPress = useCallback(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
    inputRef?.current?.focus();
    onPress?.();
  }, [inputRef, onPress]);

  useEffect(() => {
    if (!prevTrigger && trigger) {
      if (actionType === PLUS_ACTION_TYPE) {
        plusAction();
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        if (!android) {
          ReactNativeHapticFeedback.trigger('selection');
        }
      } else if (actionType === MINUS_ACTION_TYPE) {
        minusAction();
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        if (!android) {
          ReactNativeHapticFeedback.trigger('selection');
        }
      }
    }
  }, [trigger, prevTrigger, actionType, plusAction, minusAction]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <GweiStepButton
        buttonColor={buttonColor}
        onLongPress={onMinusLongPress}
        onLongPressEnded={onLongPressEnded}
        onPress={onMinusPress}
        shouldLongPressEndPress
        type={MINUS_ACTION_TYPE}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
