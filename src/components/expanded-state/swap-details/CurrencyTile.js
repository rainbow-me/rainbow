import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { CoinIcon } from '../../coin-icon';
import { Centered, ColumnWithMargins } from '../../layout';
import { TruncatedText } from '../../text';
import { useColorForAsset } from '@rainbow-me/hooks';
import { colors, position } from '@rainbow-me/styles';

const CurrencyTileHeight = 143;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  border-radius: 30;
  flex: 1;
  height: ${CurrencyTileHeight};
  overflow: hidden;
`;

const Gradient = styled(RadialGradient).attrs(({ color, type }) => ({
  center: type === 'input' ? [0, 0] : [CurrencyTileHeight, CurrencyTileHeight],
  colors: [colors.alpha(color, 0.04), colors.alpha(color, 0)],
}))`
  ${position.cover};
`;

const NativePriceText = styled(TruncatedText).attrs({
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'heavy',
})``;

export default function CurrencyTile({
  amountDisplay,
  asset,
  isHighSlippage,
  type = 'input',
  ...props
}) {
  const { address, symbol } = asset;
  const colorForAsset = useColorForAsset(asset);

  return (
    <Container {...props}>
      <Gradient color={colorForAsset} type={type} />
      <ColumnWithMargins centered margin={15}>
        <CoinIcon address={address} size={50} symbol={symbol} />
        <ColumnWithMargins centered margin={4} paddingHorizontal={8}>
          <NativePriceText>
            $123.45
            {isHighSlippage && (
              <NativePriceText color={colors.warning}>{` 􀇿`}</NativePriceText>
            )}
          </NativePriceText>
          <TruncatedText
            color={colors.blueGreyDark80}
            letterSpacing="roundedTight"
            size="smedium"
            weight="semibold"
          >
            {`${type === 'output' ? '~' : ''}${amountDisplay} ${symbol}`}
          </TruncatedText>
        </ColumnWithMargins>
      </ColumnWithMargins>
    </Container>
  );
}
