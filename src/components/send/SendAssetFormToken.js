import React, { Fragment } from 'react';
import styled from 'styled-components';
import { Column } from '../layout';
import SendAssetFormField from './SendAssetFormField';
import { useDimensions } from '@rainbow-me/hooks';
import { supportedNativeCurrencies } from '@rainbow-me/references';
import { removeLeadingZeros } from '@rainbow-me/utils';

const FooterContainer = styled(Column).attrs({
  justify: 'end',
  marginBottom: 0,
})`
  width: 100%;
  z-index: 3;
`;

const FormContainer = styled(Column).attrs({
  align: 'center',
  justify: 'center',
})`
  flex: 1;
  min-height: ${({ isSmallPhone, isTinyPhone }) =>
    isTinyPhone ? 104 : android || isSmallPhone ? 134 : 167};
  width: 100%;
`;

const Spacer = styled.View`
  height: ${({ isSmallPhone, isTinyPhone }) =>
    isTinyPhone ? 8 : isSmallPhone ? 12 : 15};
  width: 100%;
`;

export default function SendAssetFormToken({
  assetAmount,
  assetInputRef,
  buttonRenderer,
  colorForAsset,
  nativeAmount,
  nativeCurrency,
  nativeCurrencyInputRef,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onFocusAssetInput,
  onFocusNativeInput,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) {
  const { isSmallPhone, isTinyPhone } = useDimensions();
  const { colors } = useTheme();

  const {
    mask: nativeMask,
    placeholder: nativePlaceholder,
  } = supportedNativeCurrencies[nativeCurrency];

  return (
    <Fragment>
      <FormContainer
        isSmallPhone={isSmallPhone}
        isTinyPhone={isTinyPhone}
        {...props}
      >
        <SendAssetFormField
          colorForAsset={colorForAsset}
          format={removeLeadingZeros}
          label={selected.symbol}
          onChange={onChangeAssetAmount}
          onFocus={onFocusAssetInput}
          onPressButton={sendMaxBalance}
          placeholder="0"
          ref={assetInputRef}
          testID="selected-asset-field"
          value={assetAmount}
        />
        <Spacer isSmallPhone={isSmallPhone} isTinyPhone={isTinyPhone} />
        <SendAssetFormField
          autoFocus
          colorForAsset={colors.alpha(colors.blueGreyDark, 0.8)}
          label={nativeCurrency}
          mask={nativeMask}
          maxLabelColor={colors.alpha(colors.blueGreyDark, 0.6)}
          onChange={onChangeNativeAmount}
          onFocus={onFocusNativeInput}
          onPressButton={sendMaxBalance}
          placeholder={nativePlaceholder}
          ref={nativeCurrencyInputRef}
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
