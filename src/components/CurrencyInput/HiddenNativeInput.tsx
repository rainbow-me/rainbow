import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface HiddenNativeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const HiddenNativeInput = forwardRef<TextInput, HiddenNativeInputProps>(
  ({ value, onChangeText, onFocus, onBlur, disabled = false, autoFocus = false }, ref) => {
    return (
      <View style={styles.container} pointerEvents="none">
        <TextInput
          ref={ref}
          keyboardType="decimal-pad"
          defaultValue={value === '0' ? '' : value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          style={styles.input}
          caretHidden={true}
          selectTextOnFocus={false}
          autoFocus={autoFocus}
        />
      </View>
    );
  }
);

HiddenNativeInput.displayName = 'HiddenNativeInput';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  input: {
    position: 'absolute',
    left: -9999,
    fontSize: 16,
  },
});
