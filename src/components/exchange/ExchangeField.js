import React, { useCallback, useEffect } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { useDebounce } from 'use-debounce';
import { TokenSelectionButton } from '../buttons';
import { ChainBadge, CoinIcon, CoinIconSize } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { AssetType } from '@rainbow-me/entities';
import { useColorForAsset, useTimeout } from '@rainbow-me/hooks';
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
    mainnetAddress,
    amount,
    disableCurrencySelection,
    editable,
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
    updateOnFocus = true,
    ...props
  },
  ref
) => {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset({
    address,
    fallbackColor: colors.appleBlue,
    mainnet_address: mainnetAddress,
    type: mainnetAddress ? AssetType.token : type,
  });
  const handleFocusField = useCallback(() => {
    ref?.current?.focus();
  }, [ref]);

  const [value, setValue] = useState(amount);
  const [editing, setEditing] = useState(false);
  const [debouncedValue] = useDebounce(value, 300);
  const [startTimeout, stopTimeout] = useTimeout();
  const handleBlur = useCallback(
    event => {
      onBlur?.(event);
    },
    [onBlur]
  );
  const handleFocus = useCallback(
    event => {
      if (updateOnFocus) {
        onFocus?.(event);
      }
    },
    [onFocus, updateOnFocus]
  );

  useEffect(() => {
    setAmount(debouncedValue);
  }, [debouncedValue, setAmount]);

  useEffect(() => {
    setEditing(true);
    startTimeout(() => setEditing(false), 1000);
    return () => stopTimeout();
  }, [value, startTimeout, stopTimeout]);

  const placeholderTextColor = symbol
    ? colors.alpha(colors.blueGreyDark, 0.3)
    : colors.alpha(colors.blueGreyDark, 0.1);

  const placeholderText = symbol ? '0' : EnDash.unicode;

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
            onChangeText={setValue}
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
