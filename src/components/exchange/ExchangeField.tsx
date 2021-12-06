import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon, CoinIconSize } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeInput' was resolved to '/Users/n... Remove this comment to see the full error message
import ExchangeInput from './ExchangeInput';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const ExchangeFieldHeight = android ? 64 : 38;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const ExchangeFieldPadding = android ? 15 : 19;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const CoinIconSkeleton = styled.View`
  ${borders.buildCircle(CoinIconSize)};
  background-color: ${({ theme: { colors } }: any) =>
    colors.alpha(colors.blueGreyDark, 0.1)};
`;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'flex-end',
})`
  width: 100%;
  padding-right: ${ExchangeFieldPadding};
`;

const FieldRow = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 10,
})`
  flex: 1;
  padding-left: ${ExchangeFieldPadding};
  padding-right: ${({ disableCurrencySelection }) =>
    disableCurrencySelection ? ExchangeFieldPadding : 0};
`;

const Input = styled(ExchangeInput).attrs({
  letterSpacing: 'roundedTightest',
})`
  margin-vertical: -10;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  height: ${ExchangeFieldHeight + (android ? 20 : 0)};
`;

const ExchangeField = (
  {
    address,
    amount,
    disableCurrencySelection,
    editable,
    onBlur,
    onFocus,
    onPressSelectCurrency,
    setAmount,
    symbol,
    testID,
    useCustomAndroidMask = false,
    ...props
  }: any,
  ref: any
) => {
  const colorForAsset = useColorForAsset({ address });
  const handleFocusField = useCallback(() => ref?.current?.focus(), [ref]);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableWithoutFeedback onPress={handleFocusField}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <FieldRow disableCurrencySelection={disableCurrencySelection}>
          {symbol ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CoinIcon address={address} symbol={symbol} />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CoinIconSkeleton />
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Input
            color={colorForAsset}
            editable={editable}
            onBlur={onBlur}
            onChangeText={setAmount}
            onFocus={onFocus}
            placeholder={symbol ? '0' : EnDash.unicode}
            placeholderTextColor={
              symbol ? undefined : colors.alpha(colors.blueGreyDark, 0.1)
            }
            ref={ref}
            testID={amount ? `${testID}-${amount}` : testID}
            useCustomAndroidMask={useCustomAndroidMask}
            value={amount}
          />
        </FieldRow>
      </TouchableWithoutFeedback>
      {!disableCurrencySelection && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TokenSelectionButton
          address={address}
          onPress={onPressSelectCurrency}
          symbol={symbol}
          testID={testID + '-selection-button'}
        />
      )}
    </Container>
  );
};

export default React.forwardRef(ExchangeField);
