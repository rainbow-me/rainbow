import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { CoinIcon } from '../../coin-icon';
import { Centered, ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedText } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/swap' or its... Remove this comment to see the full error message
import { SwapModalField } from '@rainbow-me/redux/swap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { convertAmountAndPriceToNativeDisplay } from '@rainbow-me/utilities';

export const CurrencyTileHeight = 143;

const AmountText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedTight',
  size: 'smedium',
  weight: 'semibold',
}))``;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  border-radius: 30;
  flex: 1;
  height: ${CurrencyTileHeight};
  overflow: hidden;
`;

const Gradient = styled(RadialGradient).attrs(
  ({ theme: { colors }, color, type }) => ({
    center:
      type === 'input' ? [0, 0] : [CurrencyTileHeight, CurrencyTileHeight],
    colors: [colors.alpha(color, 0.04), colors.alpha(color, 0)],
  })
)`
  ${position.cover};
`;

const NativePriceText = styled(TruncatedText).attrs({
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'heavy',
})`
  ${fontWithWidth(fonts.weight.heavy)};
`;

const TruncatedAmountText = styled(AmountText).attrs({
  as: TruncatedText,
})`
  flex-grow: 0;
  flex-shrink: 1;
`;

export default function CurrencyTile({
  amount,
  amountDisplay,
  asset,
  isHighPriceImpact,
  priceImpactColor,
  priceValue,
  type = 'input',
  ...props
}: any) {
  const inputAsExact = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'swap' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
    state => state.swap.independentField !== SwapModalField.output
  );
  const { nativeCurrency } = useAccountSettings();
  const colorForAsset = useColorForAsset(asset);
  const { address, symbol } = asset;
  const isOther =
    (inputAsExact && type === 'output') || (!inputAsExact && type === 'input');

  const priceDisplay = priceValue
    ? convertAmountAndPriceToNativeDisplay(
        amount,
        priceValue ?? 0,
        nativeCurrency
      ).display
    : '-';

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Gradient color={colorForAsset} type={type} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins centered margin={15}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinIcon address={address} size={50} symbol={symbol} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ColumnWithMargins centered margin={4} paddingHorizontal={8}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <NativePriceText>
            {priceDisplay}
            {isHighPriceImpact && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <NativePriceText color={priceImpactColor}>{` 􀇿`}</NativePriceText>
            )}
          </NativePriceText>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row align="center">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TruncatedAmountText>
              {`${isOther ? '~' : ''}${amountDisplay}`}
            </TruncatedAmountText>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <AmountText>{` ${symbol}`}</AmountText>
          </Row>
        </ColumnWithMargins>
      </ColumnWithMargins>
    </Container>
  );
}
