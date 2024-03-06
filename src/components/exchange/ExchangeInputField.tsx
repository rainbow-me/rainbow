import React, { MutableRefObject } from 'react';
import { TextInput } from 'react-native';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';
import { Network } from '@/helpers';
import styled from '@/styled-thing';
import { TokenColors } from '@/graphql/__generated__/metadata';

const Container = styled(ColumnWithMargins).attrs({ margin: 5 })({
  paddingTop: android ? 0 : 6,
  width: '100%',
  zIndex: 1,
});

const NativeFieldRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})({
  height: android ? 16 : 32,
  paddingLeft: 19,
});

interface ExchangeInputFieldProps {
  color: string;
  disableInputCurrencySelection: boolean;
  editable: boolean;
  loading: boolean;
  nativeAmount: string | null;
  nativeCurrency: string;
  nativeFieldRef: MutableRefObject<TextInput | null>;
  network: Network;
  onFocus: ({ target }: { target: Element }) => void;
  onPressMaxBalance: () => void;
  onPressSelectInputCurrency: (chainId: any) => void;
  inputAmount: string | null;
  inputCurrencyIcon?: string;
  inputCurrencyColors?: TokenColors;
  inputCurrencyAddress: string;
  inputCurrencyMainnetAddress?: string;
  inputCurrencyNetwork?: string;
  inputCurrencySymbol?: string;
  inputFieldRef: MutableRefObject<TextInput | null>;
  setInputAmount: (value: string | null) => void;
  setNativeAmount: (value: string | null) => void;
  updateAmountOnFocus: boolean;
  testID: string;
}

export default function ExchangeInputField({
  color,
  disableInputCurrencySelection,
  editable,
  inputAmount,
  inputCurrencyAddress,
  inputCurrencyMainnetAddress,
  inputCurrencySymbol,
  inputCurrencyIcon,
  inputCurrencyColors,
  inputFieldRef,
  loading,
  nativeAmount,
  nativeCurrency,
  nativeFieldRef,
  network,
  inputCurrencyNetwork,
  onFocus,
  onPressMaxBalance,
  onPressSelectInputCurrency,
  setInputAmount,
  setNativeAmount,
  testID,
  updateAmountOnFocus,
}: ExchangeInputFieldProps) {
  return (
    <Container>
      <ExchangeField
        icon={inputCurrencyIcon}
        colors={inputCurrencyColors}
        address={inputCurrencyAddress}
        color={color}
        amount={inputAmount}
        disableCurrencySelection={disableInputCurrencySelection}
        editable={editable}
        loading={loading}
        mainnetAddress={inputCurrencyMainnetAddress}
        network={network}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectInputCurrency}
        ref={inputFieldRef}
        setAmount={setInputAmount}
        symbol={inputCurrencySymbol}
        testID={testID}
        type={inputCurrencyNetwork}
        updateOnFocus={updateAmountOnFocus}
        useCustomAndroidMask={android}
      />
      <NativeFieldRow>
        <ExchangeNativeField
          color={color}
          editable={editable}
          height={64}
          loading={loading}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onFocus={onFocus}
          ref={nativeFieldRef}
          setNativeAmount={setNativeAmount}
          testID={testID + '-native'}
          updateOnFocus={updateAmountOnFocus}
        />
        <ExchangeMaxButton color={color} disabled={!inputCurrencySymbol} onPress={onPressMaxBalance} testID={testID + '-max'} />
      </NativeFieldRow>
    </Container>
  );
}
