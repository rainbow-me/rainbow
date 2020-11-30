import React from 'react';
import styled from 'styled-components/primitives';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';
import { useColorForAsset } from '@rainbow-me/hooks';

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
  const colorForAsset = useColorForAsset({ address: inputCurrencyAddress });

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
      />
      <NativeFieldRow>
        <ExchangeNativeField
          colorForAsset={colorForAsset}
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
          color={colorForAsset}
          disabled={!inputCurrencySymbol}
          onPress={onPressMaxBalance}
          testID={testID + '-max'}
        />
      </NativeFieldRow>
    </Container>
  );
}
