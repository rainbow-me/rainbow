import React, { useCallback, forwardRef } from 'react';
import { AnimatedText, Box, Text, useTextStyle } from '@/design-system';
import { Input } from '@/components/inputs';
import Animated, { withTiming, runOnUI, useAnimatedRef, useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { TextInput, TextInputProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { colors } from '@/styles';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';
import { UNFOCUSED_FIELD_BORDER_COLOR, FOCUSED_FIELD_BORDER_COLOR } from '../constants';

const AnimatedInput = Animated.createAnimatedComponent(Input);
const TITLE_GAP = 10;

interface SingleFieldInputProps extends TextInputProps {
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  onInputChange?: (text: string) => void;
  validationWorklet?: (text: string) =>
    | {
        error: boolean;
        message?: string;
      }
    | undefined;
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  labelPosition?: 'left' | 'right';
}

export const SingleFieldInput = forwardRef<TextInput, SingleFieldInputProps>(
  ({ title, icon, subtitle, inputStyle, style, validationWorklet, onInputChange, labelPosition = 'left', ...textInputProps }, ref) => {
    const internalRef = useAnimatedRef<TextInput>();
    const inputRef = ref ?? internalRef;

    const isFocused = useSharedValue(false);
    const focusProgress = useSharedValue(0);
    const inputValue = useSharedValue('');
    const errorLabel = useSharedValue('');
    const hasError = useSharedValue(false);

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

    const _onChangeText = useCallback(
      (text: string) => {
        'worklet';
        inputValue.value = text;
        if (validationWorklet) {
          const result = validationWorklet(text);
          if (result) {
            errorLabel.value = result.message ?? '';
            hasError.value = result.error;
          } else {
            errorLabel.value = '';
            hasError.value = false;
          }
        }
        if (onInputChange) {
          runOnJS(onInputChange)(text);
        }
      },
      [inputValue, validationWorklet, onInputChange, errorLabel, hasError]
    );

    const containerStyle = useAnimatedStyle(() => ({
      borderColor: hasError.value ? colors.red : isFocused.value ? FOCUSED_FIELD_BORDER_COLOR : UNFOCUSED_FIELD_BORDER_COLOR,
    }));

    const titleContainerStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: withTiming(errorLabel.value === '' ? 0 : -TITLE_GAP, TIMING_CONFIGS.fadeConfig) }],
    }));

    const inputTextStyle = useTextStyle({
      color: 'label',
      size: '17pt',
      weight: 'heavy',
    });

    const LabelContent = () => (
      <Animated.View style={{ position: 'relative', gap: 10 }}>
        <Animated.View style={titleContainerStyle}>{title ? <FieldLabel>{title}</FieldLabel> : <Box>{icon}</Box>}</Animated.View>
        <Animated.View style={{ position: 'absolute', top: TITLE_GAP }}>
          <AnimatedText
            numberOfLines={1}
            style={{
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
    );

    const InputContent = () => (
      <AnimatedInput
        ref={inputRef}
        style={[
          inputTextStyle,
          {
            flex: 1,
            textAlign: labelPosition === 'left' ? 'right' : 'left',
            paddingVertical: 16,
          },
          inputStyle,
        ]}
        onFocus={() => runOnUI(handleFocusWorklet)()}
        onBlur={() => runOnUI(handleBlurWorklet)()}
        onChangeText={_onChangeText}
        spellCheck={false}
        textAlignVertical="center"
        {...textInputProps}
      />
    );

    return (
      // @ts-expect-error TODO: fix this
      <FieldContainer style={[containerStyle, style]}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          {labelPosition === 'left' ? (
            <>
              {(title || icon) && <LabelContent />}
              <InputContent />
            </>
          ) : (
            <>
              <InputContent />
              {(title || icon) && <LabelContent />}
            </>
          )}
        </Box>
      </FieldContainer>
    );
  }
);

SingleFieldInput.displayName = 'SingleFieldInput';
