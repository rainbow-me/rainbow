import React, { Fragment } from 'react';
import { Platform } from 'react-native';

import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';
import useDimensions from '@/hooks/useDimensions';
import { supportedCurrencies as supportedNativeCurrencies } from '@/references/supportedCurrencies';
import { useTheme } from '@/theme/ThemeContext';
import { NAVIGATION_BAR_HEIGHT } from '@/utils/deviceUtils';
import { removeLeadingZeros } from '@/utils/formatters';

import { Column } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const FooterContainer = styled(Column).attrs({
  justify: 'end',
  marginBottom: NAVIGATION_BAR_HEIGHT,
})({
  width: '100%',
  zIndex: 3,
});

const FormContainer = styled(Column).attrs({
  align: 'center',
  justify: 'center',
})({
  flex: 1,
  minHeight: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 104 : Platform.OS === 'android' || isSmallPhone ? 134 : 167),
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
          colorForAsset={opacity(colors.blueGreyDark, 0.8)}
          label={nativeCurrency}
          mask={nativeMask}
          maxLabelColor={opacity(colors.blueGreyDark, 0.6)}
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
