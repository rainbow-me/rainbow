import React, {
  FocusEvent,
  ForwardRefRenderFunction,
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { TokenSelectionButton } from '../buttons';
import { ChainBadge, CoinIcon, CoinIconSize } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { AssetType } from '@/entities';
import { Network } from '@/helpers';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { borders } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';

const ExchangeFieldHeight = android ? 64 : 38;
const ExchangeFieldPadding = android ? 15 : 19;

const CoinIconSkeleton = styled(View)({
  ...borders.buildCircleAsObject(CoinIconSize),
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) =>
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
  paddingRight: ({
    disableCurrencySelection,
  }: {
    disableCurrencySelection: boolean;
  }) => (disableCurrencySelection ? ExchangeFieldPadding : 6),
});

const Input = styled(ExchangeInput).attrs({
  letterSpacing: 'roundedTightest',
})({
  height: ExchangeFieldHeight + (android ? 20 : 0),
  marginVertical: -10,
});

interface ExchangeFieldProps {
  address: string;
  mainnetAddress?: string;
  amount: string | null;
  disableCurrencySelection?: boolean;
  editable: boolean;
  loading: boolean;
  type?: string;
  network: Network;
  onBlur?: (event: FocusEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onPressSelectCurrency: (chainId: any) => void;
  onTapWhileDisabled?: () => void;
  setAmount: (value: string | null) => void;
  symbol?: string;
  testID: string;
  useCustomAndroidMask: boolean;
  updateOnFocus: boolean;
}

const ExchangeField: ForwardRefRenderFunction<TextInput, ExchangeFieldProps> = (
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
  const inputRef = ref as MutableRefObject<TextInput>;
  const { colors } = useTheme();
  const [value, setValue] = useState(amount);

  const colorForAsset = useColorForAsset(
    {
      address,

      mainnet_address: mainnetAddress,
      type: mainnetAddress ? AssetType.token : type,
    },
    address ? undefined : colors.appleBlue
  );
  const handleFocusField = useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

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

  const editing = inputRef?.current?.isFocused() ?? false;

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
            /* @ts-expect-error — JavaScript component */
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
