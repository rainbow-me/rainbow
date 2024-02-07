import React, { Fragment } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { Column } from '../layout';
import SendAssetFormField from './SendAssetFormField';
import { useDimensions } from '@/hooks';
import { supportedNativeCurrencies } from '@/references';
import styled from '@/styled-thing';
import { removeLeadingZeros } from '@/utils';

const footerMargin = getSoftMenuBarHeight() / 2;
const FooterContainer = styled(Column).attrs({
  justify: 'end',
  marginBottom: android ? footerMargin : 0,
})({
  width: '100%',
  zIndex: 3,
});

const FormContainer = styled(Column).attrs({
  align: 'center',
  justify: 'center',
})({
  flex: 1,
  minHeight: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 104 : android || isSmallPhone ? 134 : 167),
  width: '100%',
});

const Spacer = styled.View({
  height: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 8 : isSmallPhone ? 12 : 15),
  width: '100%',
});

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

  const { mask: nativeMask, placeholder: nativePlaceholder } = supportedNativeCurrencies[nativeCurrency];

  return (
    <Fragment>
      <FormContainer isSmallPhone={isSmallPhone} isTinyPhone={isTinyPhone} {...props}>
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
