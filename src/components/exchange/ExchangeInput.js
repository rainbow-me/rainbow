import React, { Fragment, useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import TextInputMask from 'react-native-text-input-mask';
import { Text } from '../text';
import styled from '@/styled-thing';
import { buildTextStyles } from '@/styles';
import { magicMemo } from '@/utils';

const AndroidMaskWrapper = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  bottom: 0,
  left: 68.7,
  position: 'absolute',
  right: 0,
  top: 11.5,
});

const Input = styled(TextInputMask).attrs({
  allowFontScaling: false,
  keyboardType: 'decimal-pad',
})(props => ({
  flex: 1,
  ...buildTextStyles.object(props),
  ...(android ? { fontWeight: 'normal' } : {}),
}));

const ExchangeInput = (
  {
    androidMaskMaxLength = 8,
    color: givenColor,
    editable,
    keyboardAppearance = 'dark',
    letterSpacing = 'roundedTightest',
    lineHeight,
    mask = '[099999999999999999].[999999999999999999]',
    onBlur,
    onChange,
    onChangeText,
    onFocus,
    placeholder = '0',
    placeholderTextColor: givenPlaceholderTextColor,
    selectionColor: givenSelectionColor,
    size = 'h2',
    testID,
    useCustomAndroidMask = false,
    value = '',
    weight = 'semibold',
    ...props
  },
  ref
) => {
  const { colors } = useTheme();
  const color = givenColor || colors.dark;
  const placeholderTextColor = givenPlaceholderTextColor || colors.alpha(colors.blueGreyDark, 0.3);
  const selectionColor = givenSelectionColor || color;
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const handleBlur = useCallback(
    event => {
      if (typeof value === 'string') {
        const parts = value.split('.');
        if (parseFloat(parts.join('')) === 0) {
          ref?.current?.clear();
        } else if (parts[0].length > 1 && !Number(parts[0])) {
          onChangeText(`0.${parts[1]}`);
        }
      }
      setIsFocused(false);
      setIsTouched(false);
      onBlur?.(event);
    },
    [onBlur, onChangeText, ref, value]
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

  let valueToRender = value;
  if (value?.length > androidMaskMaxLength) {
    valueToRender = value.substring(0, androidMaskMaxLength) + '...';
  }

  return (
    <Fragment>
      <Input
        {...props}
        color={color}
        editable={editable}
        keyboardAppearance={keyboardAppearance}
        letterSpacing={letterSpacing}
        lineHeight={lineHeight}
        mask={mask}
        onBlur={handleBlur}
        onChange={handleChange}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        ref={ref}
        selectionColor={selectionColor}
        size={size}
        testID={value ? `${testID}-${value}` : testID}
        value={value}
        weight={weight}
      />
      {useCustomAndroidMask && value > 0 && !ref.current?.isFocused?.() && (
        <AndroidMaskWrapper>
          <Text color={color} letterSpacing={letterSpacing} size={size} testID={testID} weight={weight} {...props}>
            {valueToRender}
          </Text>
        </AndroidMaskWrapper>
      )}
    </Fragment>
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
