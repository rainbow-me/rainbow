import React, { useCallback, useMemo, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components';
import { Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeInput' was resolved to '/Users/n... Remove this comment to see the full error message
import ExchangeInput from './ExchangeInput';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { supportedNativeCurrencies } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts } from '@rainbow-me/styles';

const CurrencySymbol = styled(Text).attrs(({ height, color }) => ({
  color: color,
  letterSpacing: 'roundedTight',
  lineHeight: height,
  size: 'larger',
  weight: 'regular',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? 'margin-bottom: 1.5;' : ''};
`;

const NativeInput = styled(ExchangeInput).attrs({
  letterSpacing: fonts.letterSpacing.roundedTight,
  size: fonts.size.larger,
  weight: fonts.weight.regular,
})`
  height: ${({ height }) => height};
`;

const ExchangeNativeField = (
  {
    address,
    editable,
    height,
    nativeAmount,
    nativeCurrency,
    onFocus,
    setNativeAmount,
    testID,
  }: any,
  ref: any
) => {
  const colorForAsset = useColorForAsset({ address });
  const [isFocused, setIsFocused] = useState(false);
  const { mask, placeholder, symbol } = supportedNativeCurrencies[
    nativeCurrency
  ];

  const handleFocusNativeField = useCallback(() => ref?.current?.focus(), [
    ref,
  ]);

  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleFocus = useCallback(
    event => {
      setIsFocused(true);
      if (onFocus) onFocus(event);
    },
    [onFocus]
  );
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const nativeAmountColor = useMemo(() => {
    const nativeAmountExists =
      typeof nativeAmount === 'string' && nativeAmount.length > 0;

    const color = isFocused ? colors.dark : colors.blueGreyDark;
    const opacity = isFocused ? 1 : nativeAmountExists ? 0.5 : 0.3;

    return colors.alpha(color, opacity);
  }, [colors, isFocused, nativeAmount]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TouchableWithoutFeedback onPress={handleFocusNativeField}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row align="center" flex={1} height={height}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CurrencySymbol color={nativeAmountColor} height={height}>
          {symbol}
        </CurrencySymbol>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <NativeInput
          color={nativeAmountColor}
          editable={editable}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          height={android ? height : 58}
          mask={mask}
          onBlur={handleBlur}
          onChangeText={setNativeAmount}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          selectionColor={colorForAsset}
          testID={nativeAmount ? `${testID}-${nativeAmount}` : testID}
          value={nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

export default React.forwardRef(ExchangeNativeField);
