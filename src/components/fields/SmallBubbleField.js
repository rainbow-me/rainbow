import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import ExchangeInput from '@/components/ExchangeInput';
import { Column, Row } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { IS_ANDROID } from '@/env';
import { IS_SMALL_PHONE, IS_TINY_PHONE } from '@/utils/deviceUtils';

const BubbleInput = styled(ExchangeInput).attrs(({ theme: { isDarkMode } }) => ({
  disableTabularNums: true,
  keyboardAppearance: isDarkMode ? 'dark' : 'light',
  letterSpacing: 'roundedTightest',
  lineHeight: IS_ANDROID ? (IS_TINY_PHONE ? 27 : IS_ANDROID || IS_SMALL_PHONE ? 31 : 38) : undefined,
  size: IS_TINY_PHONE ? 'big' : IS_SMALL_PHONE ? 'bigger' : 'h3',
  weight: 'semibold',
}))(() => ({
  ...(IS_ANDROID ? (IS_TINY_PHONE ? { height: 40 } : { height: 46 }) : {}),
  ...(IS_ANDROID ? { paddingBottom: 0, paddingTop: 0 } : {}),

  marginRight: 10,
}));

const defaultFormatter = string => string;

const BubbleField = (
  {
    autoFocus,
    buttonText,
    colorForAsset,
    format = defaultFormatter,
    keyboardType,
    mask,
    maxLabelColor,
    maxLength,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    testID,
    value: valueProp,
    ...props
  },
  forwardedRef
) => {
  const [isFocused, setIsFocused] = useState(autoFocus);
  const [value, setValue] = useState(valueProp);
  const [wasButtonPressed, setWasButtonPressed] = useState(false);

  const ref = useRef();
  useImperativeHandle(forwardedRef, () => ref.current);

  const formattedValue = useMemo(() => format(String(value || '')), [format, value]);

  const handleBlur = useCallback(
    event => {
      setIsFocused(false);
      onBlur?.(event);
    },
    [onBlur]
  );

  const handleChangeText = useCallback(
    text => {
      const formattedValue = format(text);

      if (value !== formattedValue) {
        setValue(formattedValue);
        onChange?.(formattedValue);
      }
    },
    [format, onChange, value]
  );

  const handleFocus = useCallback(
    event => {
      setIsFocused(true);
      onFocus?.(event);
    },
    [onFocus]
  );

  useEffect(() => {
    if (valueProp !== value && (!ref.current?.isFocused?.() || wasButtonPressed)) {
      setValue(valueProp);
      setWasButtonPressed(false);
    }
  }, [forwardedRef, value, valueProp, wasButtonPressed]);

  const { colors, isDarkMode } = useTheme();

  return (
    <Column flex={1} pointerEvents={android || isFocused ? 'auto' : 'none'} {...props}>
      <Row align="center" justify="space-between">
        <BubbleInput
          autoFocus={autoFocus}
          color={colorForAsset}
          isDarkMode={isDarkMode}
          isSmallPhone={IS_ANDROID || IS_SMALL_PHONE}
          isTinyPhone={IS_TINY_PHONE}
          keyboardType={keyboardType}
          mask={mask}
          maxLength={maxLength}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={maxLabelColor ? colors.alpha(colors.blueGreyDark, 0.32) : colors.alpha(colorForAsset, 0.4)}
          ref={ref}
          testID={testID + '-input'}
          value={formattedValue}
        />
        {buttonText && (
          <Text size="medium" weight="bold">
            gwei
          </Text>
        )}
      </Row>
    </Column>
  );
};

export default React.forwardRef(BubbleField);
