import React, { ForwardedRef } from 'react';
import { TextInput as TextInputPrimitive, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import styled from '@/styled-thing';
import { buildTextStyles, fonts } from '@/styles';
import { opacity } from '@/__swaps__/utils/swaps';

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
  const defaultSelectionColor = IS_IOS ? blue : opacity(blue, 0.2);

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
      style={[{ fontFamily: fonts.family.SFProRounded }, style]}
      testID={testID}
      textContentType={textContentType}
    />
  );
};

export default React.forwardRef<TextInputPrimitive, InputProps>(Input);
