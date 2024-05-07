import React from 'react';
import { useSelector } from 'react-redux';
import { Centered } from '../../layout';
import { Text, TruncatedText } from '../../text';
import { Box, Column, Columns, Row, Rows } from '@/design-system';
import { useAccountSettings, useColorForAsset, useDimensions } from '@/hooks';
import { SwapModalField } from '@/redux/swap';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';

export const CurrencyTileHeight = android ? 153 : 143;

const AmountText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedTight',
  size: 'smedium',
  weight: 'semibold',
}))();

const Container = styled(Centered).attrs({
  direction: 'column',
})({
  borderRadius: 30,
  flex: 1,
  height: CurrencyTileHeight,
  overflow: 'hidden',
  zIndex: 0,
  ...(android ? { paddingTop: 4 } : {}),
});

const Gradient = styled(Box).attrs(({ theme: { colors }, color }) => ({
  backgroundColor: colors.alpha(color, 0.08),
}))({
  ...position.coverAsObject,
});

const NativePriceText = styled(TruncatedText).attrs({
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'heavy',
})({
  maxWidth: ({ maxWidth }) => maxWidth,
});

const TruncatedAmountText = styled(AmountText)({
  flexGrow: 0,
  flexShrink: 1,
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
  const { width } = useDimensions();
  const inputAsExact = useSelector(state => state.swap.independentField !== SwapModalField.output);
  const { nativeCurrency } = useAccountSettings();
  const colorForAsset = useColorForAsset(asset);
  const theme = useTheme();
  const isOther = (inputAsExact && type === 'output') || (!inputAsExact && type === 'input');

  const priceDisplay = priceValue ? convertAmountToNativeDisplay(priceValue, nativeCurrency) : '-';

  return (
    <Container {...props}>
      <Gradient color={colorForAsset} />
      <Box paddingHorizontal="15px (Deprecated)">
        <Rows alignHorizontal="center" alignVertical="center" space="10px">
          <Row height="content">
            <RainbowCoinIcon
              size={50}
              icon={asset?.icon_url}
              network={asset?.network}
              symbol={asset?.symbol}
              colors={asset?.colors}
              theme={theme}
            />
          </Row>
          <Row height="content">
            <Box width="full">
              <Rows space={ios && '4px'}>
                <Row height="content">
                  <Columns alignHorizontal="center" space="4px">
                    <Column width="content">
                      <NativePriceText maxWidth={width / 4}>
                        {isOther && '~'}
                        {amountDisplay}
                      </NativePriceText>
                    </Column>
                    <Column alignHorizontal="center" width="content">
                      <NativePriceText>{asset?.symbol}</NativePriceText>
                    </Column>
                  </Columns>
                </Row>
                <Row height="content">
                  <Box alignItems="center" justifyContent="center" marginTop={android && '-6px'} width="full">
                    <TruncatedAmountText as={TruncatedText}>
                      {priceDisplay}
                      {isHighPriceImpact && <NativePriceText color={priceImpactColor}>{` 􀇿`}</NativePriceText>}
                    </TruncatedAmountText>
                  </Box>
                </Row>
              </Rows>
            </Box>
          </Row>
        </Rows>
      </Box>
    </Container>
  );
}
