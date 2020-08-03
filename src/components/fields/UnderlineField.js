import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { Button } from '../buttons';
import { ExchangeInput } from '../exchange';
import { Column, Row } from '../layout';
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

const UnderlineInput = styled(ExchangeInput).attrs({
  color: colors.dark,
  disableTabularNums: true,
  keyboardAppearance: 'light',
  letterSpacing: 'roundedTightest',
  size: 'h3',
  weight: 'medium',
})`
  padding-right: 8;
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

  const animation = useTimingTransition(isFocused, {
    duration: 150,
    easing: Easing.ease,
  });

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

  const showFieldButton = buttonText && isFocused;

  return (
    <Column flex={1} {...props}>
      <Row align="center" justify="space-between" style={{ marginBottom: 8 }}>
        <UnderlineInput
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          mask={mask}
          maxLength={maxLength}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          value={formattedValue}
        />
        {showFieldButton && (
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
        <UnderlineAnimated style={{ transform: [{ scaleX: animation }] }} />
      </UnderlineContainer>
    </Column>
  );
};

export default React.forwardRef(UnderlineField);
