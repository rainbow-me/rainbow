import React from 'react';
import { Platform, TextInput as TextInputPrimitive } from 'react-native';
import styled from 'styled-components/primitives';
import { buildTextStyles, colors } from '@rainbow-me/styles';

const TextInput = styled(TextInputPrimitive).attrs({
  selectionColor:
    Platform.OS === 'ios' ? colors.appleBlue : colors.appleBlueTransparent,
})`
  /* our Input uses same styling system as our <Text /> component */
  ${buildTextStyles};
`;

const Input = (
  {
    allowFontScaling = false,
    autoCapitalize = 'none',
    autoCorrect = false,
    keyboardType,
    placeholderTextColor = colors.placeholder,
    spellCheck = true,
    ...props
  },
  ref
) => {
  return (
    <TextInput
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor}
      ref={ref}
      spellCheck={spellCheck}
    />
  );
};

export default React.forwardRef(Input);
