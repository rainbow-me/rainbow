import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { ExchangeInput } from '../exchange';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
const BubbleInput = styled(ExchangeInput).attrs(({ isSmallPhone, isTinyPhone, theme: { isDarkMode } }) => ({
  disableTabularNums: true,
  keyboardAppearance: isDarkMode ? 'dark' : 'light',
  letterSpacing: 'roundedTightest',
  lineHeight: android ? (isTinyPhone ? 27 : android || isSmallPhone ? 31 : 38) : undefined,
  size: isTinyPhone ? 'big' : isSmallPhone ? 'bigger' : 'h3',
  weight: 'semibold',
}))(({ isTinyPhone }) => ({
  ...(android ? (isTinyPhone ? { height: 40 } : { height: 46 }) : {}),
  ...(android ? { paddingBottom: 0, paddingTop: 0 } : {}),

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
  const { isSmallPhone, isTinyPhone } = useDimensions();

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
          isSmallPhone={android || isSmallPhone}
          isTinyPhone={isTinyPhone}
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
