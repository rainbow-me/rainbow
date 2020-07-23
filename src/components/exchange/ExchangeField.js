import React, { useCallback } from 'react';
import { Platform, TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/primitives';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { colors } from '@rainbow-me/styles';

const CoinSize = 40;
const ExchangeFieldHeight = Platform.OS === 'android' ? 64 : 40;
const ExchangeFieldPadding = 15;
const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

const Container = styled(Row).attrs({
  align: 'center',
})`
  background-color: ${colors.white};
  width: 100%;
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
  height: ${ExchangeFieldHeight};
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
    ...props
  },
  ref
) => {
  const handleFocusField = useCallback(() => ref?.current?.focus(), [ref]);

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
            value={amount}
          />
        </FieldRow>
      </TouchableWithoutFeedback>
      {!disableCurrencySelection && (
        <TokenSelectionButton onPress={onPressSelectCurrency} symbol={symbol} />
      )}
    </Container>
  );
};

export default React.forwardRef(ExchangeField);
