import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ExchangeInput } from '../exchange';
import { Column, Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
const BubbleInput = styled(ExchangeInput).attrs(
  ({ isSmallPhone, isTinyPhone, theme: { isDarkMode } }) => ({
    disableTabularNums: true,
    keyboardAppearance: isDarkMode ? 'dark' : 'light',
    letterSpacing: 'roundedTightest',
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    lineHeight: android
      ? isTinyPhone
        ? 27
        : // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        android || isSmallPhone
        ? 31
        : 38
      : undefined,
    size: isTinyPhone ? 'big' : isSmallPhone ? 'bigger' : 'h3',
    weight: 'semibold',
  })
)`
    ${({ isTinyPhone }) =>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android ? (isTinyPhone ? 'height: 40' : 'height: 46;') : ''}}
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    ${android ? 'padding-bottom: 0;' : ''}
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    ${android ? 'padding-top: 0;' : ''}
    margin-right: 10;
  `;

const defaultFormatter = (string: any) => string;

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
  }: any,
  forwardedRef: any
) => {
  const { isSmallPhone, isTinyPhone } = useDimensions();

  const [isFocused, setIsFocused] = useState(autoFocus);
  const [value, setValue] = useState(valueProp);
  const [wasButtonPressed, setWasButtonPressed] = useState(false);

  const ref = useRef();
  useImperativeHandle(forwardedRef, () => ref.current);

  const formattedValue = useMemo(() => format(String(value || '')), [
    format,
    value,
  ]);

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
    if (
      valueProp !== value &&
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isFocused' does not exist on type 'never... Remove this comment to see the full error message
      (!ref.current?.isFocused?.() || wasButtonPressed)
    ) {
      setValue(valueProp);
      setWasButtonPressed(false);
    }
  }, [forwardedRef, value, valueProp, wasButtonPressed]);

  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column
      flex={1}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      pointerEvents={android || isFocused ? 'auto' : 'none'}
      {...props}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row align="center" justify="space-between">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BubbleInput
          autoFocus={autoFocus}
          color={colorForAsset}
          isDarkMode={isDarkMode}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          isSmallPhone={android || isSmallPhone}
          isTinyPhone={isTinyPhone}
          keyboardType={keyboardType}
          mask={mask}
          maxLength={maxLength}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={
            maxLabelColor
              ? colors.alpha(colors.blueGreyDark, 0.32)
              : colors.alpha(colorForAsset, 0.4)
          }
          ref={ref}
          testID={testID + '-input'}
          value={formattedValue}
        />
        {buttonText && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Text size="medium" weight="bold">
            gwei
          </Text>
        )}
      </Row>
    </Column>
  );
};

export default React.forwardRef(BubbleField);
