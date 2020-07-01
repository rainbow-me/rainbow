import React, { useMemo } from 'react';
import styled from 'styled-components/primitives';
import { useColorForAsset } from '../../../hooks';
import { magicMemo } from '../../../utils';
import { CoinIcon, CoinIconSize } from '../../coin-icon';
import { ColumnWithMargins, Row } from '../../layout';
import { TruncatedText } from '../../text';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(0, 19, 19)};
`;

const ETHCoinIcon = styled(CoinIcon).attrs({
  shadow: [[0, 4, 12, colors.dark, 0.3]],
})`
  bottom: 0;
  left: ${CoinIconSize - 6};
  position: absolute;
  top: 0;
`;

const Title = styled(TruncatedText).attrs(({ color = colors.dark }) => ({
  color,
  letterSpacing: 'roundedTight',
  size: 'big',
  weight: 'bold',
}))``;

function LiquidityPoolExpandedStateHeader({ asset }) {
  const { address, shadowColor, symbol } = asset;

  const color = useColorForAsset(asset);
  const coinIconShadow = useMemo(
    () => [[0, 4, 12, shadowColor || color, 0.3]],
    [color, shadowColor]
  );

  return (
    <Container>
      <Row align="center">
        <ETHCoinIcon symbol="ETH" />
        <CoinIcon address={address} shadow={coinIconShadow} symbol={symbol} />
      </Row>
      <Row align="center" justify="space-between">
        <ColumnWithMargins align="start" margin={4}>
          <Title>{`${symbol}-ETH Pool`}</Title>
        </ColumnWithMargins>
      </Row>
    </Container>
  );
}

export default magicMemo(LiquidityPoolExpandedStateHeader, 'asset');
