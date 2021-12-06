import React, { Fragment, useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import TextInputMask from 'react-native-text-input-mask';
import styled from 'styled-components';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { buildTextStyles } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const AndroidMaskWrapper = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.white};
  bottom: 0;
  left: 68.7;
  position: absolute;
  right: 0;
  top: 11.5;
`;

const Input = styled(TextInputMask).attrs({
  allowFontScaling: false,
  keyboardType: 'decimal-pad',
})`
  ${buildTextStyles};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? 'font-weight: normal' : ''};
  flex: 1;
`;

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
  }: any,
  ref: any
) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const color = givenColor || colors.dark;
  const placeholderTextColor =
    givenPlaceholderTextColor || colors.alpha(colors.blueGreyDark, 0.3);
  const selectionColor = givenSelectionColor || color;
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

  let valueToRender = value;
  if (value?.length > androidMaskMaxLength) {
    valueToRender = value.substring(0, androidMaskMaxLength) + '...';
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
        testID={testID}
        value={value}
        weight={weight}
      />
      {useCustomAndroidMask && value > 0 && !ref.current?.isFocused() && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AndroidMaskWrapper>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            color={color}
            letterSpacing={letterSpacing}
            size={size}
            testID={testID}
            weight={weight}
            {...props}
          >
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
