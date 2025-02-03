import React, { useCallback } from 'react';
import { AnimatedText, Box, Text, TextShadow, useTextStyle } from '@/design-system';
import { Input } from '@/components/inputs';
import Animated, {
  withTiming,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { NativeSyntheticEvent, TextInput, TextInputChangeEventData, TextInputProps } from 'react-native';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { colors } from '@/styles';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';

const AnimatedInput = Animated.createAnimatedComponent(Input);
const UNFOCUSED_BORDER_COLOR = 'rgba(255, 255, 255, 0.03)';
const FOCUSED_BORDER_COLOR = 'rgba(255, 255, 255, 0.25)';
const TITLE_GAP = 10;

interface SingleFieldInputProps extends TextInputProps {
  title: string;
  subtitle?: string;
  onInputChange?: (text: string) => void;
  validationWorklet?: (text: string) => string;
}

export function SingleFieldInput({ title, subtitle, style, validationWorklet, onInputChange, ...textInputProps }: SingleFieldInputProps) {
  const inputRef = useAnimatedRef<TextInput>();
  const isFocused = useSharedValue(false);
  const focusProgress = useSharedValue(0);
  const inputValue = useSharedValue('');
  const errorLabel = useSharedValue('');

  const handleFocusWorklet = useCallback(() => {
    'worklet';
    isFocused.value = true;
    focusProgress.value = withTiming(1, TIMING_CONFIGS.fadeConfig);
  }, [focusProgress, isFocused]);

  const handleBlurWorklet = useCallback(() => {
    'worklet';
    isFocused.value = false;
    focusProgress.value = withTiming(0, TIMING_CONFIGS.fadeConfig);
  }, [focusProgress, isFocused]);

  const _onChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      'worklet';
      const text = event.nativeEvent.text;
      inputValue.value = text;
      if (validationWorklet) {
        errorLabel.value = validationWorklet(text);
      }
      if (onInputChange) {
        runOnJS(onInputChange)(text);
      }
    },
    [inputValue, validationWorklet, onInputChange, errorLabel]
  );

  const containerStyle = useAnimatedStyle(() => ({
    borderColor:
      errorLabel.value === '' ? interpolateColor(focusProgress.value, [0, 1], [UNFOCUSED_BORDER_COLOR, FOCUSED_BORDER_COLOR]) : colors.red,
  }));

  const titleContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(errorLabel.value === '' ? 0 : -TITLE_GAP, TIMING_CONFIGS.fadeConfig) }],
  }));

  const inputTextStyle = useTextStyle({
    align: 'left',
    color: 'label',
    size: '17pt',
    weight: 'heavy',
  });

  return (
    <FieldContainer style={containerStyle}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Animated.View style={{ position: 'relative', gap: 10 }}>
          <Animated.View style={titleContainerStyle}>
            <FieldLabel>{title}</FieldLabel>
          </Animated.View>
          <Animated.View style={{ position: 'absolute', top: TITLE_GAP }}>
            <AnimatedText
              numberOfLines={1}
              style={{
                // arbitrary
                width: 400,
              }}
              color="red"
              size="13pt"
              weight="heavy"
            >
              {errorLabel}
            </AnimatedText>
          </Animated.View>
          {subtitle && (
            <Text color="labelSecondary" size="13pt" weight="heavy">
              {subtitle}
            </Text>
          )}
        </Animated.View>
        <AnimatedInput
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...textInputProps}
          ref={inputRef}
          style={[inputTextStyle, { flex: 1, textAlign: 'right', paddingVertical: 16 }, style]}
          onFocus={() => runOnUI(handleFocusWorklet)()}
          onBlur={() => runOnUI(handleBlurWorklet)()}
          onChange={_onChange}
          spellCheck={false}
          textAlign="right"
          textAlignVertical="center"
        />
      </Box>
    </FieldContainer>
  );
}
