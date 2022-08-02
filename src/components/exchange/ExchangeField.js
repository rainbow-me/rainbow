import React, { useCallback, useEffect } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { TokenSelectionButton } from '../buttons';
import { ChainBadge, CoinIcon, CoinIconSize } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { AssetType } from '@rainbow-me/entities';
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
    disableCurrencySelection ? ExchangeFieldPadding : 6,
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
    mainnetAddress,
    amount,
    disableCurrencySelection,
    editable,
    loading,
    type,
    network,
    onBlur,
    onFocus,
    onPressSelectCurrency,
    onTapWhileDisabled,
    setAmount,
    symbol,
    testID,
    useCustomAndroidMask = false,
    updateOnFocus = false,
    ...props
  },
  ref
) => {
  const { colors } = useTheme();
  const [value, setValue] = useState(amount);

  const colorForAsset = useColorForAsset({
    address,
    fallbackColor: colors.appleBlue,
    mainnet_address: mainnetAddress,
    type: mainnetAddress ? AssetType.token : type,
  });
  const handleFocusField = useCallback(() => {
    ref?.current?.focus();
  }, [ref]);

  const handleBlur = useCallback(
    event => {
      onBlur?.(event);
    },
    [onBlur]
  );
  const handleFocus = useCallback(
    event => {
      onFocus?.(event);
      if (loading) {
        setAmount(value);
      }
    },
    [loading, onFocus, setAmount, value]
  );

  const onChangeText = useCallback(
    text => {
      setAmount(text);
      setValue(text);
    },
    [setAmount]
  );

  const placeholderTextColor = symbol
    ? colors.alpha(colors.blueGreyDark, 0.3)
    : colors.alpha(colors.blueGreyDark, 0.1);

  const placeholderText = symbol ? '0' : EnDash.unicode;

  const editing = ref?.current?.isFocused() ?? false;

  useEffect(() => {
    if (!editing || updateOnFocus) {
      setValue(amount);
    }
  }, [amount, editing, updateOnFocus]);

  return (
    <Container {...props}>
      <TouchableWithoutFeedback
        onPress={onTapWhileDisabled ?? handleFocusField}
      >
        <FieldRow disableCurrencySelection={disableCurrencySelection}>
          {symbol ? (
            <CoinIcon
              address={address}
              mainnet_address={mainnetAddress}
              symbol={symbol}
              type={type}
            />
          ) : (
            <View>
              <CoinIconSkeleton />
              <ChainBadge assetType={network} />
            </View>
          )}

          <Input
            {...(android &&
              colorForAsset && {
                selectionColor: colors.alpha(colorForAsset, 0.4),
              })}
            color={colorForAsset}
            editable={editable}
            onBlur={handleBlur}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            placeholder={placeholderText}
            placeholderTextColor={placeholderTextColor}
            {...(onTapWhileDisabled && { pointerEvents: 'none' })}
            ref={ref}
            testID={testID}
            useCustomAndroidMask={useCustomAndroidMask}
            value={editing ? value : amount}
          />
        </FieldRow>
      </TouchableWithoutFeedback>
      {!disableCurrencySelection && (
        <TokenSelectionButton
          address={address}
          mainnetAddress={mainnetAddress}
          onPress={onPressSelectCurrency}
          symbol={symbol}
          testID={testID + '-selection-button'}
          type={type}
        />
      )}
    </Container>
  );
};

export default React.forwardRef(ExchangeField);
