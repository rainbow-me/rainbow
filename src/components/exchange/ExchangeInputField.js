import React from 'react';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';
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
}) {
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
