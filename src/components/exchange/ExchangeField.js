import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon, CoinIconSize } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { useColorForAsset } from '@rainbow-me/hooks';
import styled from 'styled-components';
import { borders } from '@rainbow-me/styles';

const ExchangeFieldHeight = android ? 64 : 38;
const ExchangeFieldPadding = android ? 15 : 19;

const CoinIconSkeleton = styled.View({
  ...borders.buildCircleAsObject(CoinIconSize),
  backgroundColor: ({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.1),
});

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'flex-end',
})({
  paddingRight: ExchangeFieldPadding,
  width: '100%',
});

const FieldRow = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 10,
})({
  flex: 1,
  paddingLeft: ExchangeFieldPadding,
  paddingRight: ({ disableCurrencySelection }) =>
    disableCurrencySelection ? ExchangeFieldPadding : 0,
});

const Input = styled(ExchangeInput).attrs({
  letterSpacing: 'roundedTightest',
})({
  height: ExchangeFieldHeight + (android ? 20 : 0),
  marginVertical: -10,
});

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
  },
  ref
) => {
  const colorForAsset = useColorForAsset({ address });
  const handleFocusField = useCallback(() => ref?.current?.focus(), [ref]);
  const { colors } = useTheme();

  return (
    <Container {...props}>
      <TouchableWithoutFeedback onPress={handleFocusField}>
        <FieldRow disableCurrencySelection={disableCurrencySelection}>
          {symbol ? (
            <CoinIcon address={address} symbol={symbol} />
          ) : (
            <CoinIconSkeleton />
          )}
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
