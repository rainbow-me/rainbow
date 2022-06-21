import React from 'react';
import { Row } from '../layout';
import ExchangeField from './ExchangeField';
import styled from '@rainbow-me/styled-components';

const paddingTop = android ? 15 : 32;

const Container = styled(Row).attrs({ align: 'center' })({
  overflow: 'hidden',
  paddingBottom: 21,
  paddingTop,
  width: '100%',
});

export default function ExchangeOutputField({
  editable,
  network,
  onFocus,
  onPressSelectOutputCurrency,
  onTapWhileDisabled,
  outputAmount,
  outputCurrencyAddress,
  outputCurrencyMainnetAddress,
  outputCurrencyAssetType,
  outputCurrencySymbol,
  outputFieldRef,
  setOutputAmount,
  testID,
}) {
  return (
    <Container>
      <ExchangeField
        address={outputCurrencyAddress}
        amount={outputAmount}
        editable={editable}
        mainnetAddress={outputCurrencyMainnetAddress}
        network={network}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectOutputCurrency}
        onTapWhileDisabled={onTapWhileDisabled}
        ref={outputFieldRef}
        setAmount={setOutputAmount}
        symbol={outputCurrencySymbol}
        testID={testID}
        type={outputCurrencyAssetType}
        useCustomAndroidMask={android}
      />
    </Container>
  );
}
