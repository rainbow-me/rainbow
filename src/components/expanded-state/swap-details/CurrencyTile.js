import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { useSelector } from 'react-redux';
import { CoinIcon } from '../../coin-icon';
import { Centered, ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedText } from '../../text';
import { useAccountSettings, useColorForAsset } from '@rainbow-me/hooks';
import { SwapModalField } from '@rainbow-me/redux/swap';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';
import { convertAmountAndPriceToNativeDisplay } from '@rainbow-me/utilities';
import styled from 'rainbowed-components';

export const CurrencyTileHeight = 143;

const AmountText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedTight',
  size: 'smedium',
  weight: 'semibold',
}))({});

const Container = styled(Centered).attrs({
  direction: 'column',
})({
  borderRadius: 30,
  flex: 1,
  height: CurrencyTileHeight,
  overflow: 'hidden',
});

const Gradient = styled(RadialGradient).attrs(
  ({ theme: { colors }, color, type }) => ({
    center:
      type === 'input' ? [0, 0] : [CurrencyTileHeight, CurrencyTileHeight],
    colors: [colors.alpha(color, 0.04), colors.alpha(color, 0)],
  })
)({
  ...position.coverAsObject,
});

const NativePriceText = styled(TruncatedText).attrs({
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'heavy',
})({
  ...fontWithWidth(fonts.weight.heavy),
});

const TruncatedAmountText = styled(AmountText)({
  flexGrow: 0,
  flexShrink: 1,

  ...(android ? { height: 26.7 } : {}),
});

export default function CurrencyTile({
  amount,
  amountDisplay,
  asset,
  isHighPriceImpact,
  priceImpactColor,
  priceValue,
  type = 'input',
  ...props
}) {
  const inputAsExact = useSelector(
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
    <Container {...props}>
      <Gradient color={colorForAsset} type={type} />
      <ColumnWithMargins centered margin={15}>
        <CoinIcon address={address} size={50} symbol={symbol} />
        <ColumnWithMargins centered margin={4} paddingHorizontal={8}>
          <NativePriceText>
            {priceDisplay}
            {isHighPriceImpact && (
              <NativePriceText color={priceImpactColor}>{` 􀇿`}</NativePriceText>
            )}
          </NativePriceText>
          <Row align="center">
            <TruncatedAmountText as={TruncatedText}>
              {`${isOther ? '~' : ''}${amountDisplay}`}
            </TruncatedAmountText>
            <AmountText>{` ${symbol}`}</AmountText>
          </Row>
        </ColumnWithMargins>
      </ColumnWithMargins>
    </Container>
  );
}
