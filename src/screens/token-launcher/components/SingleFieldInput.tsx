import React, { useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { AnimatedText, AnimatedTextProps, Box, Text, useTextStyle } from '@/design-system';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import Animated, {
  withTiming,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  useAnimatedReaction,
  AnimatedStyle,
} from 'react-native-reanimated';
import { TextInput, TextInputProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';
import { UNFOCUSED_FIELD_BORDER_COLOR, FOCUSED_FIELD_BORDER_COLOR, INPUT_HEIGHT, ERROR_RED } from '../constants';
import { ButtonPressAnimation } from '@/components/animations';

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
    const textAlign = textInputProps.textAlign || (labelPosition === 'left' ? 'right' : 'left');

    return (
      <AnimatedInput
        ref={ref}
        numberOfLines={1}
        style={[
          inputTextStyle,
          {
            flex: 1,
            height: '100%',
            textAlign,
            paddingLeft: labelPosition === 'left' && textAlign === 'right' ? 16 : 0,
            // These three custom values applied by the useTextStyle hook need to be overriden or the text will be misaligned / cut off
            marginBottom: 0,
            marginTop: 0,
            lineHeight: undefined,
            // Resets Android's default vertical padding
            paddingVertical: 0,
          },
          inputStyle,
        ]}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...textInputProps}
      />
    );
  })
);

FieldInput.displayName = 'FieldInput';

export type SingleFieldInputRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setNativeProps: (props: object) => void;
  setNativeTextWithInputValidation: (text: string) => void;
};

// Animated refs cannot be used with useImperativeHandle:
// https://github.com/software-mansion/react-native-reanimated/issues/3226
export const SingleFieldInput = forwardRef<SingleFieldInputRef, SingleFieldInputProps>(
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

    const isFocused = useSharedValue(false);
    const inputValue = useSharedValue('');
    const errorLabel = useSharedValue('');
    const hasError = useSharedValue(false);
    const [isSubtitleVisible, setIsSubtitleVisible] = useState(true);

    // We expose a custom ref to the parent component because we want to run the validation logic when the native text is set imperatively
    useImperativeHandle(ref, () => ({
      focus: () => {
        internalRef.current?.focus();
      },
      blur: () => {
        internalRef.current?.blur();
      },
      clear: () => {
        internalRef.current?.clear();
      },
      setNativeProps: (props: object) => {
        internalRef.current?.setNativeProps(props);
      },
      setNativeTextWithInputValidation: (text: string) => {
        internalRef.current?.setNativeProps({ text });
        inputValue.value = text;
        // We cannot run this worklet with runOnUI here
        // https://github.com/software-mansion/react-native-reanimated/discussions/5199
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
      },
    }));

    const handleFocusWorklet = useCallback(() => {
      'worklet';
      isFocused.value = true;
    }, [isFocused]);

    const handleBlurWorklet = useCallback(() => {
      'worklet';
      isFocused.value = false;
    }, [isFocused]);

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
        if (internalRef && 'current' in internalRef && internalRef.current) {
          internalRef.current.setNativeProps({ text: content });
        }
      }
    }, [_onChangeText, internalRef]);

    const containerStyle = useAnimatedStyle(() => ({
      borderColor: hasError.value ? ERROR_RED : isFocused.value ? FOCUSED_FIELD_BORDER_COLOR : UNFOCUSED_FIELD_BORDER_COLOR,
    }));

    const titleContainerStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: withTiming(errorLabel.value === '' ? 0 : -TITLE_GAP, TIMING_CONFIGS.fadeConfig) }],
    }));

    const pasteButtonStyle = useAnimatedStyle(() => ({
      display: inputValue.value === '' ? 'flex' : 'none',
    }));

    // Hide subtitle if there is an error
    useAnimatedReaction(
      () => errorLabel.value,
      (value, prevValue) => {
        if (subtitle && value !== '') {
          runOnJS(setIsSubtitleVisible)(false);
        } else if (subtitle && prevValue !== '' && value === '') {
          runOnJS(setIsSubtitleVisible)(true);
        }
      },
      [errorLabel, subtitle]
    );

    return (
      <FieldContainer style={[containerStyle, { height: INPUT_HEIGHT }, style]}>
        <Box height={'full'} flexDirection="row" alignItems="center" justifyContent="space-between">
          {labelPosition === 'right' && showPaste && (
            <PasteButton handlePaste={handlePaste} pasteButtonStyle={pasteButtonStyle} pasteButtonText={pasteButtonText} />
          )}
          {labelPosition === 'left' && (title || icon) && (
            <LabelContent
              errorLabel={errorLabel}
              icon={icon}
              isSubtitleVisible={isSubtitleVisible}
              labelPosition={labelPosition}
              subtitle={subtitle}
              textAlign={textInputProps.textAlign}
              title={title}
              titleContainerStyle={titleContainerStyle}
            />
          )}
          <FieldInput
            ref={internalRef}
            labelPosition={labelPosition}
            inputStyle={inputStyle}
            onFocus={_onFocus}
            onBlur={_onBlur}
            onChangeText={_onChangeText}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...textInputProps}
          />
          {labelPosition === 'left' && showPaste && (
            <PasteButton handlePaste={handlePaste} pasteButtonStyle={pasteButtonStyle} pasteButtonText={pasteButtonText} />
          )}
          {labelPosition === 'right' && (title || icon) && (
            <LabelContent
              errorLabel={errorLabel}
              icon={icon}
              isSubtitleVisible={isSubtitleVisible}
              labelPosition={labelPosition}
              subtitle={subtitle}
              textAlign={textInputProps.textAlign}
              title={title}
              titleContainerStyle={titleContainerStyle}
            />
          )}
        </Box>
      </FieldContainer>
    );
  }
);

const LabelContent = ({
  errorLabel,
  icon,
  isSubtitleVisible,
  labelPosition,
  subtitle,
  textAlign,
  title,
  titleContainerStyle,
}: {
  errorLabel: AnimatedTextProps['children'];
  icon: React.ReactNode;
  isSubtitleVisible: boolean;
  labelPosition: 'left' | 'right';
  subtitle: string | undefined;
  textAlign: TextInputProps['textAlign'];
  title: string | undefined;
  titleContainerStyle: AnimatedStyle;
}) => (
  <Animated.View style={{ position: 'relative', gap: 10, paddingRight: labelPosition === 'left' && textAlign === 'right' ? 20 : 0 }}>
    <Animated.View style={titleContainerStyle}>{title ? <FieldLabel>{title}</FieldLabel> : <Box>{icon}</Box>}</Animated.View>
    <Animated.View style={{ position: 'absolute', top: TITLE_GAP }}>
      <AnimatedText
        numberOfLines={1}
        style={{
          // Arbitrary width to prevent text from clipping
          width: 400,
        }}
        color={{ custom: ERROR_RED }}
        size="13pt"
        weight="bold"
      >
        {errorLabel}
      </AnimatedText>
    </Animated.View>
    {subtitle && isSubtitleVisible && (
      <Text color="labelQuaternary" size="13pt" weight="bold">
        {subtitle}
      </Text>
    )}
  </Animated.View>
);

const PasteButton = ({
  handlePaste,
  pasteButtonStyle,
  pasteButtonText,
}: {
  handlePaste: () => void;
  pasteButtonStyle: AnimatedStyle;
  pasteButtonText: string;
}) => (
  <Animated.View style={pasteButtonStyle}>
    <ButtonPressAnimation onPress={handlePaste}>
      <Text color="labelTertiary" size="17pt" weight="heavy">
        {pasteButtonText}
      </Text>
    </ButtonPressAnimation>
  </Animated.View>
);

SingleFieldInput.displayName = 'SingleFieldInput';
