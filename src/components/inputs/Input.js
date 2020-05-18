import React, { useImperativeHandle, useRef } from 'react';
import { TextInput as TextInputPrimitive } from 'react-native';
import styled from 'styled-components/primitives';
import { buildTextStyles, colors } from '../../styles';

const TextInput = styled(TextInputPrimitive)`
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
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    blur: event => inputRef?.current?.blur(event),
    clear: () => inputRef?.current?.clear(),
    focus: event => inputRef?.current?.focus(event),
    isFocused: () => inputRef?.current?.isFocused(),
    setNativeProps: nativeProps =>
      inputRef?.current?.setNativeProps(nativeProps),
  }));

  return (
    <TextInput
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor}
      ref={inputRef}
      spellCheck={spellCheck}
    />
  );
};

export default React.forwardRef(Input);
