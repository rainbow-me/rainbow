import React from 'react';
import { TextInput as TextInputPrimitive } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
  }: any,
  ref: any
) => {
  const { isDarkMode, colors } = useTheme();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  const defaultSelectionColor = ios
    ? colors.appleBlue
    : colors.appleBlueTransparent;

  const defaultPlaceholderTextColor = colors.placeholder;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
