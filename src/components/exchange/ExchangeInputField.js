import React from 'react';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';
import styled from '@rainbow-me/styled-components';

const Container = styled(ColumnWithMargins).attrs({ margin: 5 })({
  paddingTop: 6,
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
  inputCurrencySymbol,
  inputFieldRef,
  nativeAmount,
  nativeCurrency,
  nativeFieldRef,
  onFocus,
  onPressMaxBalance,
  onPressSelectInputCurrency,
  setInputAmount,
  setNativeAmount,
  testID,
}) {
  return (
    <Container>
      <ExchangeField
        address={inputCurrencyAddress}
        amount={inputAmount}
        disableCurrencySelection={disableInputCurrencySelection}
        editable={editable}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectInputCurrency}
        ref={inputFieldRef}
        setAmount={setInputAmount}
        symbol={inputCurrencySymbol}
        testID={testID}
        useCustomAndroidMask={android}
      />
      <NativeFieldRow>
        <ExchangeNativeField
          address={inputCurrencyAddress}
          editable
          height={64}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onFocus={onFocus}
          ref={nativeFieldRef}
          setNativeAmount={setNativeAmount}
          testID={testID + '-native'}
        />
        <ExchangeMaxButton
          address={inputCurrencyAddress}
          disabled={!inputCurrencySymbol}
          onPress={onPressMaxBalance}
          testID={testID + '-max'}
        />
      </NativeFieldRow>
    </Container>
  );
}
