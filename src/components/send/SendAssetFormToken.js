import React, { Fragment } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import styled from 'styled-components';
import { Column } from '../layout';
import SendAssetFormField from './SendAssetFormField';
import { useDimensions } from '@rainbow-me/hooks';
import { supportedNativeCurrencies } from '@rainbow-me/references';
import { removeLeadingZeros } from '@rainbow-me/utils';

const footerMargin = 30 + getSoftMenuBarHeight() / 2;
const FooterContainer = styled(Column).attrs({
  justify: 'end',
  marginBottom: android ? footerMargin : 0,
})`
  padding-bottom: 5;
  width: 100%;
  z-index: 3;
`;

const FormContainer = styled(Column).attrs({
  align: 'center',
  justify: 'center',
})`
  flex: ${({ isSmallPhone }) => (android ? 1.8 : isSmallPhone ? 1.75 : 1)};
  width: 100%;
`;

const Spacer = styled.View`
  height: 15;
  width: 100%;
`;

export default function SendAssetFormToken({
  assetAmount,
  buttonRenderer,
  colorForAsset,
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
  const { isSmallPhone } = useDimensions();
  const { colors } = useTheme();

  const {
    mask: nativeMask,
    placeholder: nativePlaceholder,
  } = supportedNativeCurrencies[nativeCurrency];

  return (
    <Fragment>
      <FormContainer isSmallPhone={isSmallPhone} {...props}>
        <SendAssetFormField
          colorForAsset={colorForAsset}
          format={removeLeadingZeros}
          label={selected.symbol}
          onChange={onChangeAssetAmount}
          onFocus={onFocus}
          onPressButton={sendMaxBalance}
          placeholder="0"
          testID="selected-asset-field"
          value={assetAmount}
        />
        <Spacer />
        <SendAssetFormField
          autoFocus
          colorForAsset={colors.alpha(colors.blueGreyDark, 0.8)}
          label={nativeCurrency}
          mask={nativeMask}
          maxLabelColor={colors.alpha(colors.blueGreyDark, 0.6)}
          onChange={onChangeNativeAmount}
          onFocus={onFocus}
          onPressButton={sendMaxBalance}
          placeholder={nativePlaceholder}
          testID="selected-asset-quantity-field"
          value={nativeAmount}
        />
      </FormContainer>
      <FooterContainer>
        {buttonRenderer}
        {txSpeedRenderer}
      </FooterContainer>
    </Fragment>
  );
}
