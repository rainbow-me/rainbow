import React, { useCallback, useEffect } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/primitives';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { colors } from '@rainbow-me/styles';

const CoinSize = 40;
const ExchangeFieldHeight = android ? 64 : 38;
const ExchangeFieldPadding = android ? 15 : 19;
const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

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
  height: ${ExchangeFieldHeight + (android ? 20 : 0)};
`;

const ExchangeField = (
  {
    address,
    amount,
    disableCurrencySelection,
    onBlur,
    onFocus,
    onPressSelectCurrency,
    setAmount,
    symbol,
    testID,
    autoFocus,
    useCustomAndroidMask = false,
    ...props
  },
  ref
) => {
  const handleFocusField = useCallback(() => ref?.current?.focus(), [ref]);
  useEffect(() => {
    autoFocus && handleFocusField();
  }, [autoFocus, handleFocusField]);
  return (
    <Container {...props}>
      <TouchableWithoutFeedback onPress={handleFocusField}>
        <FieldRow disableCurrencySelection={disableCurrencySelection}>
          {symbol ? (
            <CoinIcon address={address} size={CoinSize} symbol={symbol} />
          ) : (
            <CoinIcon bgColor={skeletonColor} size={CoinSize} />
          )}
          <Input
            editable={!!symbol}
            onBlur={onBlur}
            onChangeText={setAmount}
            onFocus={onFocus}
            placeholder={symbol ? '0' : EnDash.unicode}
            placeholderTextColor={symbol ? undefined : skeletonColor}
            ref={ref}
            testID={amount ? `${testID}-${amount}` : testID}
            useCustomAndroidMask={useCustomAndroidMask}
            value={amount}
          />
        </FieldRow>
      </TouchableWithoutFeedback>
      {!disableCurrencySelection && (
        <TokenSelectionButton
          onPress={onPressSelectCurrency}
          symbol={symbol}
          testID={testID + '-selection-button'}
        />
      )}
    </Container>
  );
};

export default React.forwardRef(ExchangeField);
