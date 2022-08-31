import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { ButtonPressAnimation } from '../../animations';
import { Text } from '../../text';
import GweiInputPill from './GweiInputPill';
import { delay } from '@/helpers/utilities';
import { usePrevious } from '@/hooks';
import styled from '@/styled-thing';
import { TextInput } from 'react-native';
import {
  Box,
  Inline,
  Inset,
  Row,
  Rows,
  Text as NewText,
} from '@/design-system';
import { colors } from '@/styles';

const PLUS_ACTION_TYPE = 'plus';
const MINUS_ACTION_TYPE = 'minus';
const LONG_PRESS_DELAY_THRESHOLD = 69;
const MIN_LONG_PRESS_DELAY_THRESHOLD = 200;

// const Wrapper = styled(Row)({});

// const StepButtonWrapper = styled(ButtonPressAnimation).attrs(() => ({
//   paddingHorizontal: 7,
//   scaleTo: 0.75,
// }))({});

// @ts-expect-error
const StepButton = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  lineHeight: 40,
  size: 'lmedium',
  weight: 'heavy',
}))({});

const GweiStepButton = ({
  buttonColor,
  onLongPress,
  onLongPressEnded,
  onPress,
  type,
  shouldLongPressHoldPress,
}: {
  buttonColor: string;
  onLongPress: () => void;
  onLongPressEnded: () => void;
  onPress: () => void;
  type: string;
  shouldLongPressHoldPress: boolean;
}) => {
  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-expect-error
      scaleTo={0.75}
      minLongPressDuration={MIN_LONG_PRESS_DELAY_THRESHOLD}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      shouldLongPressHoldPress={shouldLongPressHoldPress}
      useLateHaptic={false}
      padding="4px"
      margin="-4px"
    >
      <NewText
        color={{ custom: buttonColor || colors.appleBlue }}
        weight="heavy"
      >
        {type === 'plus' ? '􀁍' : '􀁏'}
      </NewText>
    </Box>
  );
};

export default function FeesGweiInput({
  buttonColor,
  editable = true,
  inputRef,
  value,
  minusAction,
  onChange,
  onPress,
  onBlur,
  plusAction,
  testID,
}: {
  buttonColor: string;
  editable: boolean;
  inputRef: React.MutableRefObject<TextInput | undefined>;
  value: string;
  minusAction: () => void;
  onChange: (text: string) => void;
  onPress: () => void;
  onBlur: () => void;
  plusAction: () => void;
  testID: string;
}) {
  const longPressHandle = useRef<boolean | null>(null);
  const [trigger, setTrigger] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string | null>(null);
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

  const onInputPress = useCallback(() => {
    inputRef?.current?.focus();
    onPress?.();
  }, [inputRef, onPress]);

  useEffect(() => {
    if (!prevTrigger && trigger) {
      if (actionType === PLUS_ACTION_TYPE) {
        plusAction();
        ReactNativeHapticFeedback.trigger('selection');
      } else if (actionType === MINUS_ACTION_TYPE) {
        minusAction();
        ReactNativeHapticFeedback.trigger('selection');
      }
    }
  }, [trigger, prevTrigger, actionType, plusAction, minusAction]);

  return (
    <Box marginRight="-5px">
      <Inline alignVertical="center" space="6px">
        <GweiStepButton
          buttonColor={buttonColor}
          onLongPress={onMinusLongPress}
          onLongPressEnded={onLongPressEnded}
          onPress={onMinusPress}
          shouldLongPressHoldPress
          type={MINUS_ACTION_TYPE}
        />
        <Box>
          <GweiInputPill
            color={buttonColor}
            editable={editable}
            onBlur={onBlur}
            onChange={onChange}
            onFocus={onInputPress}
            onPress={onInputPress}
            ref={inputRef}
            testID={testID}
            value={value}
          />
        </Box>
        <GweiStepButton
          buttonColor={buttonColor}
          onLongPress={onPlusLongPress}
          onLongPressEnded={onLongPressEnded}
          onPress={onPlusPress}
          shouldLongPressHoldPress
          type={PLUS_ACTION_TYPE}
        />
      </Inline>
    </Box>
  );
}
