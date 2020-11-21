import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Button } from '../buttons';
import { ExchangeInput } from '../exchange';
import { ColumnWithMargins, Row } from '../layout';
import { useDimensions } from '@rainbow-me/hooks';
import { colors, position } from '@rainbow-me/styles';

const Underline = styled.View`
  ${position.cover};
  background-color: ${colors.blueGreyDark};
  opacity: 0.2;
`;

const UnderlineAnimated = styled(Animated.View)`
  ${position.cover};
  background-color: ${colors.sendScreen.brightBlue};
  left: -100%;
`;

const UnderlineInput = styled(ExchangeInput).attrs(({ isTinyPhone }) => ({
  color: colors.dark,
  disableTabularNums: true,
  keyboardAppearance: 'light',
  letterSpacing: 'roundedTightest',
  size: isTinyPhone || android ? 'bigger' : 'h3',
  weight: 'medium',
}))`
  padding-right: 8;
  ${android ? 'height: 40;' : ''}
  ${android ? 'padding-bottom: 0;' : ''}
  ${android ? 'padding-top: 0;' : ''}
`;

const UnderlineContainer = styled(Row)`
  border-radius: 1px;
  height: 2px;
  overflow: hidden;
  width: 100%;
`;

const defaultFormatter = string => string;

const UnderlineField = (
  {
    autoFocus,
    buttonText,
    format = defaultFormatter,
    keyboardType,
    mask,
    maxLength,
    onBlur,
    onChange,
    onFocus,
    onPressButton,
    placeholder,
    testID,
    value: valueProp,
    ...props
  },
  forwardedRef
) => {
  const { isTinyPhone } = useDimensions();

  const [isFocused, setIsFocused] = useState(autoFocus);
  const [value, setValue] = useState(valueProp);
  const [wasButtonPressed, setWasButtonPressed] = useState(false);
  const underlineSize = useSharedValue(autoFocus ? 1 : 0);

  const ref = useRef();
  useImperativeHandle(forwardedRef, () => ref.current);

  useEffect(() => {
    if (isFocused) {
      underlineSize.value = withTiming(1, {
        duration: 150,
      });
    } else {
      underlineSize.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

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

  const handleButtonPress = useCallback(
    event => {
      ref.current?.focus?.();
      setWasButtonPressed(true);
      onPressButton?.(event);
    },
    [onPressButton]
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
      (!ref.current?.isFocused?.() || wasButtonPressed)
    ) {
      setValue(valueProp);
      setWasButtonPressed(false);
    }
  }, [forwardedRef, value, valueProp, wasButtonPressed]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: underlineSize.value }],
    };
  });

  return (
    <ColumnWithMargins flex={1} margin={8} {...props}>
      <Row align="center" justify="space-between">
        <UnderlineInput
          autoFocus={autoFocus}
          isTinyPhone={isTinyPhone}
          keyboardType={keyboardType}
          mask={mask}
          maxLength={maxLength}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          testID={testID + '-input'}
          value={formattedValue}
        />
        {buttonText && isFocused && (
          <Button
            backgroundColor={colors.sendScreen.brightBlue}
            onPress={handleButtonPress}
            size="small"
            type="pill"
          >
            {buttonText}
          </Button>
        )}
      </Row>
      <UnderlineContainer>
        <Underline />
        <UnderlineAnimated style={animatedStyles} />
      </UnderlineContainer>
    </ColumnWithMargins>
  );
};

export default React.forwardRef(UnderlineField);
