import React, { Fragment } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import styled from 'styled-components';
import { Column } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SendAssetFormField' was resolved to '/Us... Remove this comment to see the full error message
import SendAssetFormField from './SendAssetFormField';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { supportedNativeCurrencies } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { removeLeadingZeros } from '@rainbow-me/utils';

const footerMargin = 30 + getSoftMenuBarHeight() / 2;
const FooterContainer = styled(Column).attrs({
  justify: 'end',
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
  flex: 1;
  min-height: ${({ isSmallPhone, isTinyPhone }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    isTinyPhone ? 104 : android || isSmallPhone ? 134 : 167};
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: ${({ isSmallPhone, isTinyPhone }: any) =>
    isTinyPhone ? 8 : isSmallPhone ? 12 : 15};
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
  onFocusAssetInput,
  onFocusNativeInput,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}: any) {
  const { isSmallPhone, isTinyPhone } = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const {
    mask: nativeMask,
    placeholder: nativePlaceholder,
  } = supportedNativeCurrencies[nativeCurrency];

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FormContainer
        isSmallPhone={isSmallPhone}
        isTinyPhone={isTinyPhone}
        {...props}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SendAssetFormField
          colorForAsset={colorForAsset}
          format={removeLeadingZeros}
          label={selected.symbol}
          onChange={onChangeAssetAmount}
          onFocus={onFocusAssetInput}
          onPressButton={sendMaxBalance}
          placeholder="0"
          testID="selected-asset-field"
          value={assetAmount}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Spacer isSmallPhone={isSmallPhone} isTinyPhone={isTinyPhone} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
          testID="selected-asset-quantity-field"
          value={nativeAmount}
        />
      </FormContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FooterContainer>
        {buttonRenderer}
        {txSpeedRenderer}
      </FooterContainer>
    </Fragment>
  );
}
