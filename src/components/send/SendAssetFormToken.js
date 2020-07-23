import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { removeLeadingZeros } from '../../utils/formatters';
import { Column, ColumnWithMargins } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const footerMargin = 31;
const FooterContainer = styled(ColumnWithMargins).attrs(({ deviceHeight }) => ({
  justify: 'end',
  margin: deviceHeight > 812 ? footerMargin : footerMargin / 2,
}))`
  flex: 1;
  width: 100%;
  z-index: 3;
`;

const FormContainer = styled(Column)`
  flex: 1;
  width: 100%;
`;

export default function SendAssetFormToken({
  assetAmount,
  buttonRenderer,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onFocus,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) {
  const { height: deviceHeight } = useDimensions();

  const {
    mask: nativeMask,
    placeholder: nativePlaceholder,
  } = supportedNativeCurrencies[nativeCurrency];

  return (
    <Fragment>
      <FormContainer {...props}>
        <SendAssetFormField
          format={removeLeadingZeros}
          label={selected.symbol}
          onChange={onChangeAssetAmount}
          onFocus={onFocus}
          onPressButton={sendMaxBalance}
          placeholder="0"
          value={assetAmount}
        />
        <SendAssetFormField
          autoFocus
          label={nativeCurrency}
          mask={nativeMask}
          onChange={onChangeNativeAmount}
          onFocus={onFocus}
          onPressButton={sendMaxBalance}
          placeholder={nativePlaceholder}
          value={nativeAmount}
        />
      </FormContainer>
      <FooterContainer deviceHeight={deviceHeight}>
        {buttonRenderer}
        {txSpeedRenderer}
      </FooterContainer>
    </Fragment>
  );
}
