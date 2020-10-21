import React, { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import TextInputMask from 'react-native-text-input-mask';
import styled from 'styled-components/primitives';
import { magicMemo } from '../../utils';
import { buildTextStyles, colors } from '@rainbow-me/styles';

const Input = styled(TextInputMask).attrs({
  allowFontScaling: false,
  keyboardType: 'decimal-pad',
  selectionColor: colors.appleBlue,
})`
  ${buildTextStyles};
  ${android ? 'font-weight: normal' : ''};
  flex: 1;
`;

const ExchangeInput = (
  {
    color = colors.dark,
    editable,
    keyboardAppearance = 'dark',
    letterSpacing = 'roundedTightest',
    mask = '[099999999999999999].[999999999999999999]',
    onBlur,
    onChange,
    onChangeText,
    onFocus,
    placeholder = '0',
    placeholderTextColor = colors.alpha(colors.blueGreyDark, 0.3),
    size = 'h2',
    testID,
    value = '',
    weight = 'semibold',
    ...props
  },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const handleBlur = useCallback(
    event => {
      if (typeof value === 'string') {
        const parts = value.split('.');
        if (parts[0].length > 1 && !Number(parts[0])) {
          onChangeText(`0.${parts[1]}`);
        }
      }
      setIsFocused(false);
      setIsTouched(false);
      onBlur?.(event);
    },
    [onBlur, onChangeText, value]
  );

  const handleChange = useCallback(
    event => {
      if (isFocused && !isTouched) {
        InteractionManager.runAfterInteractions(() => setIsTouched(true));
      }

      onChange?.(event);
    },
    [isFocused, isTouched, onChange]
  );

  const handleChangeText = useCallback(
    formatted => {
      let text = formatted;
      if (isTouched && !text.length && !value) {
        text = '0.';
      }

      onChangeText?.(text);
    },
    [isTouched, onChangeText, value]
  );

  const handleFocus = useCallback(
    event => {
      setIsFocused(true);
      onFocus?.(event);
    },
    [onFocus]
  );

  return (
    <Input
      {...props}
      color={color}
      editable={editable}
      keyboardAppearance={keyboardAppearance}
      letterSpacing={letterSpacing}
      mask={mask}
      onBlur={handleBlur}
      onChange={handleChange}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      ref={ref}
      size={size}
      testID={testID}
      value={value}
      weight={weight}
    />
  );
};

export default magicMemo(React.forwardRef(ExchangeInput), [
  'color',
  'editable',
  'placeholder',
  'placeholderTextColor',
  'onChangeText',
  'onFocus',
  'value',
]);
