import React from 'react';
import styled from 'styled-components/primitives';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';

const BottomRowHeight = android ? 52 : 32;

const Container = styled(ColumnWithMargins).attrs({ margin: 5 })`
  padding-top: 6;
  width: 100%;
  z-index: 1;
`;

const NativeFieldRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  height: ${BottomRowHeight};
  padding-left: 19;
`;

export default function ExchangeInputField({
  disableInputCurrencySelection,
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
        autoFocus={android}
        disableCurrencySelection={disableInputCurrencySelection}
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
          editable
          height={BottomRowHeight}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onFocus={onFocus}
          ref={nativeFieldRef}
          setNativeAmount={setNativeAmount}
          testID={testID + '-native'}
        />
        <ExchangeMaxButton
          disabled={!inputCurrencySymbol}
          onPress={onPressMaxBalance}
          testID={testID + '-max'}
        />
      </NativeFieldRow>
    </Container>
  );
}
