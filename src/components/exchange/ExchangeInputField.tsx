import React, { MutableRefObject } from 'react';
import { TextInput } from 'react-native';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';
import { Network } from '@/helpers';
import styled from '@/styled-thing';

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
  inputCurrencyAddress: string;
  inputCurrencyMainnetAddress?: string;
  inputCurrencyAssetType?: string;
  inputCurrencySymbol?: string;
  inputFieldRef: MutableRefObject<TextInput | null>;
  setInputAmount: (value: string | null) => void;
  setNativeAmount: (value: string | null) => void;
  updateAmountOnFocus: boolean;
  testID: string;
}

export default function ExchangeInputField({
  disableInputCurrencySelection,
  editable,
  inputAmount,
  inputCurrencyAddress,
  inputCurrencyMainnetAddress,
  inputCurrencySymbol,
  inputFieldRef,
  loading,
  nativeAmount,
  nativeCurrency,
  nativeFieldRef,
  network,
  inputCurrencyAssetType,
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
        address={inputCurrencyAddress}
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
        type={inputCurrencyAssetType}
        updateOnFocus={updateAmountOnFocus}
        useCustomAndroidMask={android}
      />
      <NativeFieldRow>
        <ExchangeNativeField
          address={inputCurrencyAddress}
          editable={editable}
          height={64}
          loading={loading}
          mainnetAddress={inputCurrencyMainnetAddress}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onFocus={onFocus}
          ref={nativeFieldRef}
          setNativeAmount={setNativeAmount}
          testID={testID + '-native'}
          type={inputCurrencyAssetType}
          updateOnFocus={updateAmountOnFocus}
        />
        <ExchangeMaxButton
          address={inputCurrencyAddress}
          disabled={!inputCurrencySymbol}
          mainnetAddress={inputCurrencyMainnetAddress}
          onPress={onPressMaxBalance}
          testID={testID + '-max'}
          type={inputCurrencyAssetType}
        />
      </NativeFieldRow>
    </Container>
  );
}
