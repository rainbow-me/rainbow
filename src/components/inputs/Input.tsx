import React, { type ForwardedRef } from 'react';
import { Platform, TextInput as TextInputPrimitive, type StyleProp, type TextInputProps, type TextStyle } from 'react-native';

import { useColorMode, useForegroundColor } from '@/design-system';
import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';
import { buildTextStyles } from '@/styles';

interface InputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
  testID?: string;
}

// @ts-expect-error TODO: Convert buildTextStyles to TS
const TextInput = styled(TextInputPrimitive)(buildTextStyles.object);

const Input = (
  {
    allowFontScaling = false,
    autoCapitalize = 'none',
    autoCorrect = false,
    keyboardAppearance,
    keyboardType,
    placeholderTextColor,
    selectionColor,
    spellCheck = true,
    style,
    testID,
    textContentType = 'none',
    ...props
  }: InputProps,
  ref: ForwardedRef<TextInputPrimitive>
) => {
  const { isDarkMode } = useColorMode();

  const labelQuaternary = useForegroundColor('labelQuaternary');

  const blue = isDarkMode ? '#0A84FF' : '#007AFF';
  const defaultSelectionColor = Platform.OS === 'ios' ? blue : opacity(blue, 0.2);

  return (
    <TextInput
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardAppearance={isDarkMode ? 'dark' : keyboardAppearance}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor || labelQuaternary}
      ref={ref}
      selectionColor={selectionColor || defaultSelectionColor}
      spellCheck={spellCheck}
      style={[Platform.OS === 'android' && { padding: 0, includeFontPadding: false }, style]}
      testID={testID}
      textContentType={textContentType}
    />
  );
};

export default React.forwardRef<TextInputPrimitive, InputProps>(Input);
