import React from 'react';
import styled from 'styled-components/primitives';
import { CoinIconGroup } from '../../coin-icon';
import { ColumnWithMargins, Row } from '../../layout';
import { TruncatedText } from '../../text';
import { colors, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(0, 19, 24)};
`;

const PerShareText = styled(TruncatedText).attrs({
  color: colors.blueGreyDark50,
  letterSpacing: 'roundedMedium',
  size: 'larger',
  weight: 'regular',
})``;

const Subtitle = styled(TruncatedText).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedTight',
  size: 'larger',
  weight: 'medium',
})``;

const Title = styled(TruncatedText).attrs(({ color = colors.dark }) => ({
  color,
  letterSpacing: 'roundedTight',
  size: 'big',
  weight: 'bold',
}))``;

function LiquidityPoolExpandedStateHeader({ assets, name, pricePerShare }) {
  return (
    <Container>
      <Row align="center">
        <CoinIconGroup tokens={assets} />
      </Row>
      <Row align="center" justify="space-between">
        <ColumnWithMargins align="start" margin={2}>
          <Title>{`${name} Pool`}</Title>
          <Subtitle>
            {pricePerShare}
            <PerShareText> per share</PerShareText>
          </Subtitle>
        </ColumnWithMargins>
      </Row>
    </Container>
  );
}

export default magicMemo(LiquidityPoolExpandedStateHeader, ['asset', 'name']);
