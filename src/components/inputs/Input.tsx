import React from 'react';
import { TextInput as TextInputPrimitive } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { buildTextStyles } from '@rainbow-me/styles';

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
    placeholderTextColor,
    selectionColor,
    spellCheck = true,
    style,
    testID,
    textContentType = 'none',
    ...props
  },
  ref
) => {
  const { isDarkMode, colors } = useTheme();

  const defaultSelectionColor = ios
    ? colors.appleBlue
    : colors.appleBlueTransparent;

  const defaultPlaceholderTextColor = colors.placeholder;

  return (
    <TextInput
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardAppearance={isDarkMode ? 'dark' : keyboardAppearance}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor || defaultPlaceholderTextColor}
      ref={ref}
      selectionColor={selectionColor || defaultSelectionColor}
      spellCheck={spellCheck}
      style={style}
      testID={testID}
      textContentType={textContentType}
    />
  );
};

export default React.forwardRef(Input);
