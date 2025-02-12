import React, { useCallback, forwardRef } from 'react';
import { AnimatedText, Box, Text, useTextStyle } from '@/design-system';
import { Input } from '@/components/inputs';
import Animated, { withTiming, runOnUI, useAnimatedRef, useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { TextInput, TextInputProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { colors } from '@/styles';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';
import { UNFOCUSED_FIELD_BORDER_COLOR, FOCUSED_FIELD_BORDER_COLOR } from '../constants';
import { ButtonPressAnimation } from '@/components/animations';

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
  showPaste?: boolean;
  pasteButtonText?: string;
}

const FieldInput = React.memo(
  forwardRef<
    TextInput,
    {
      inputStyle?: StyleProp<TextStyle>;
      labelPosition: 'left' | 'right';
    } & TextInputProps
  >(({ inputStyle, labelPosition, ...textInputProps }, ref) => {
    const inputTextStyle = useTextStyle({
      color: 'label',
      size: '17pt',
      weight: 'bold',
    });

    return (
      <AnimatedInput
        ref={ref}
        style={[
          inputTextStyle,
          {
            flex: 1,
            textAlign: labelPosition === 'left' ? 'right' : 'left',
            paddingVertical: 16,
          },
          inputStyle,
        ]}
        textAlignVertical="center"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...textInputProps}
      />
    );
  })
);

FieldInput.displayName = 'FieldInput';

export const SingleFieldInput = forwardRef<TextInput, SingleFieldInputProps>(
  (
    {
      title,
      icon,
      subtitle,
      inputStyle,
      style,
      validationWorklet,
      onInputChange,
      labelPosition = 'left',
      pasteButtonText = 'Paste',
      showPaste = false,
      ...textInputProps
    },
    ref
  ) => {
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

    const _onFocus = useCallback(() => {
      runOnUI(handleFocusWorklet)();
    }, [handleFocusWorklet]);

    const _onBlur = useCallback(() => {
      runOnUI(handleBlurWorklet)();
    }, [handleBlurWorklet]);

    const handlePaste = useCallback(async () => {
      const content = await Clipboard.getString();
      if (content) {
        _onChangeText(content);
        if (inputRef && 'current' in inputRef && inputRef.current) {
          inputRef.current.setNativeProps({ text: content });
        }
      }
    }, [_onChangeText, inputRef]);

    const containerStyle = useAnimatedStyle(() => ({
      borderColor: hasError.value ? colors.red : isFocused.value ? FOCUSED_FIELD_BORDER_COLOR : UNFOCUSED_FIELD_BORDER_COLOR,
    }));

    const titleContainerStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: withTiming(errorLabel.value === '' ? 0 : -TITLE_GAP, TIMING_CONFIGS.fadeConfig) }],
    }));

    const pasteButtonStyle = useAnimatedStyle(() => ({
      // opacity: withTiming(inputValue.value === '' ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      display: inputValue.value === '' ? 'flex' : 'none',
    }));

    // TODO: memoize this
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
            weight="bold"
          >
            {errorLabel}
          </AnimatedText>
        </Animated.View>
        {subtitle && (
          <Text color="labelSecondary" size="13pt" weight="bold">
            {subtitle}
          </Text>
        )}
      </Animated.View>
    );

    // TODO: memoize this
    const PasteButton = () => (
      <Animated.View style={pasteButtonStyle}>
        <ButtonPressAnimation onPress={handlePaste}>
          <Text color="labelTertiary" size="17pt" weight="heavy">
            {pasteButtonText}
          </Text>
        </ButtonPressAnimation>
      </Animated.View>
    );

    return (
      // @ts-expect-error TODO: fix this
      <FieldContainer style={[containerStyle, style]}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          {labelPosition === 'right' && showPaste && <PasteButton />}
          {labelPosition === 'left' && (title || icon) && <LabelContent />}
          <FieldInput
            ref={inputRef}
            labelPosition={labelPosition}
            inputStyle={inputStyle}
            onFocus={_onFocus}
            onBlur={_onBlur}
            onChangeText={_onChangeText}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...textInputProps}
          />
          {labelPosition === 'left' && showPaste && <PasteButton />}
          {labelPosition === 'right' && (title || icon) && <LabelContent />}
        </Box>
      </FieldContainer>
    );
  }
);

SingleFieldInput.displayName = 'SingleFieldInput';
