import React from 'react';
import { TextInput as TextInputPrimitive } from 'react-native';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { buildTextStyles, colors } from '@rainbow-me/styles';

const defaultSelectionColor = ios
  ? colors.appleBlue
  : colors.appleBlueTransparent;

const TextInput = styled(TextInputPrimitive)`
  /* our Input uses same styling system as our <Text /> component */
  ${buildTextStyles};
`;

const Input = (
  {
    allowFontScaling = false,
    autoCapitalize = 'none',
    autoCorrect = false,
    keyboardAppearance,
    keyboardType,
    placeholderTextColor = colors.placeholder,
    selectionColor = defaultSelectionColor,
    spellCheck = true,
    testID,
    textContentType = 'none',
    ...props
  },
  ref
) => {
  const { isDarkMode } = useTheme();

  return (
    <TextInput
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardAppearance={isDarkMode ? 'dark' : keyboardAppearance}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor}
      ref={ref}
      selectionColor={selectionColor}
      spellCheck={spellCheck}
      testID={testID}
      textContentType={textContentType}
    />
  );
};

export default React.forwardRef(Input);
