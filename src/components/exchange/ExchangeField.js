import React, { useCallback, useEffect } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { useDebounce } from 'use-debounce';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon, CoinIconSize } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash, Text } from '../text';
import ExchangeInput from './ExchangeInput';
import { useColorForAsset } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
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
    type,
    onBlur,
    onFocus,
    onPressSelectCurrency,
    onTapWhileDisabled,
    setAmount,
    symbol,
    testID,
    useCustomAndroidMask = false,
    ...props
  },
  ref
) => {
  const colorForAsset = useColorForAsset({ address });
  const handleFocusField = useCallback(() => {
    ref?.current?.focus();
    !editable && onTapWhileDisabled();
  }, [editable, onTapWhileDisabled, ref]);
  const { colors } = useTheme();

  const [value, setValue] = useState(amount);
  const [debouncedValue] = useDebounce(value, 300);

  useEffect(() => {
    setAmount(debouncedValue);
  }, [debouncedValue, setAmount]);

  const placeholderTextColor = symbol
    ? colors.alpha(colors.blueGreyDark, 0.3)
    : colors.alpha(colors.blueGreyDark, 0.1);

  const placeholderText = symbol ? '0' : EnDash.unicode;

  return (
    <Container {...props}>
      <TouchableWithoutFeedback onPress={handleFocusField}>
        <FieldRow disableCurrencySelection={disableCurrencySelection}>
          {symbol ? (
            <CoinIcon address={address} symbol={symbol} type={type} />
          ) : (
            <CoinIconSkeleton />
          )}
          {!editable && onTapWhileDisabled && (
            <Text
              color={amount > 0 ? colorForAsset : placeholderTextColor}
              letterSpacing="roundedTightest"
              size="h2"
              weight="semibold"
            >
              {amount || placeholderText}
            </Text>
          )}
          {editable && (
            <Input
              color={colorForAsset}
              editable={editable}
              onBlur={onBlur}
              onChangeText={setValue}
              onFocus={onFocus}
              onTapWhileDisabled={onTapWhileDisabled}
              placeholder={placeholderText}
              placeholderTextColor={placeholderTextColor}
              ref={ref}
              testID={amount ? `${testID}-${amount}` : testID}
              useCustomAndroidMask={useCustomAndroidMask}
              value={amount}
            />
          )}
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
