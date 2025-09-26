import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { TextInput } from 'react-native';
import { SharedValue, runOnUI, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { HiddenNativeInput } from './HiddenNativeInput';
import { CurrencyDisplay } from './CurrencyDisplay';
import { TextProps, useTextStyle } from '@/design-system';

export type CurrencyInputProps = Omit<TextProps, 'color' | 'children'> & {
  value: SharedValue<string>;
  onChangeValue?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  textColor: string;
  placeholderTextColor: string;
  disabled?: boolean;
  autoFocus?: boolean;
  // Processes raw keyboard input - validates and normalizes typed text into clean numeric string for storage
  formatInput: (text: string) => string;
  // Formats stored value for display - adds visual formatting like separators without affecting underlying data
  formatDisplay: (value: string) => string;
};

export interface CurrencyInputRef {
  setValue: (value: string) => void;
  getValue: () => string;
  focus: () => void;
  blur: () => void;
}

export const CurrencyInput = forwardRef<CurrencyInputRef, CurrencyInputProps>(
  (
    {
      value,
      onChangeValue,
      onFocus,
      onBlur,
      textColor,
      disabled = false,
      autoFocus = false,
      formatInput,
      formatDisplay,
      placeholderTextColor,
      ...textProps
    },
    ref
  ) => {
    const nativeInputRef = useRef<TextInput>(null);
    const isFocused = useSharedValue(false);

    const formattedValue = useDerivedValue(() => {
      return formatDisplay(value.value);
    });

    const textStyles = useTextStyle({
      color: { custom: textColor },
      ...textProps,
    });

    const textColorStyle = useAnimatedStyle(() => {
      const hasValue = value.value !== '';
      return {
        color: withTiming(hasValue ? textColor : placeholderTextColor, TIMING_CONFIGS.fadeConfig),
      };
    });

    const handleFocus = useCallback(() => {
      if (disabled) return;
      isFocused.value = true;
      nativeInputRef.current?.focus();
      onFocus?.();
    }, [disabled, isFocused, onFocus]);

    const handleBlur = useCallback(() => {
      isFocused.value = false;
      onBlur?.();
    }, [isFocused, onBlur]);

    const handleValueChange = useCallback(
      (newValue: string) => {
        'worklet';
        value.value = newValue;
        onChangeValue?.(newValue);
      },
      [value, onChangeValue]
    );

    const handleNativeChangeText = useCallback(
      (text: string) => {
        const finalValue = formatInput(text);

        // Update native input if the formatted value differs from the input
        // This handles cases where invalid characters (like multiple decimals) are filtered out
        if (text !== finalValue) {
          nativeInputRef.current?.setNativeProps({ text: finalValue });
        }

        value.value = finalValue;
        onChangeValue?.(finalValue);
      },
      [value, onChangeValue, formatInput]
    );

    useImperativeHandle(
      ref,
      () => ({
        setValue: (newValue: string) => {
          runOnUI(() => {
            'worklet';
            handleValueChange(newValue);
          })();
          nativeInputRef.current?.setNativeProps({ text: newValue });
        },
        getValue: () => value.value,
        focus: () => {
          nativeInputRef.current?.focus();
        },
        blur: () => {
          nativeInputRef.current?.blur();
        },
      }),
      [value, handleValueChange]
    );

    return (
      <>
        <CurrencyDisplay
          formattedValue={formattedValue}
          textColorStyle={textColorStyle}
          isFocused={isFocused}
          value={value}
          caretColor={textColor}
          disabled={disabled}
          onPress={handleFocus}
          textStyle={[textStyles, textProps.style]}
        />

        <HiddenNativeInput
          ref={nativeInputRef}
          value={value.value}
          onChangeText={handleNativeChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
        />
      </>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
