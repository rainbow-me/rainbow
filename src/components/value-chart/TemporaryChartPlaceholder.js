import { get } from 'lodash';
import React from 'react';
import styled from 'styled-components/primitives';
import { greaterThan, toFixedDecimals } from '../../helpers/utilities';
import { colors, padding } from '../../styles';
import { Icon } from '../icons';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(19, 19, 21)};
  width: 100%;
`;

const Subtitle = styled(TruncatedText).attrs({
  color: colors.blueGreyDark50,
  letterSpacing: 'uppercase',
  size: 'smedium',
  weight: 'semibold',
})``;

const Title = styled(TruncatedText).attrs({
  letterSpacing: 'roundedTight',
  size: 'bigger',
})``;

export default function TemporaryChartPlaceholder({ asset }) {
  const change = get(asset, 'price.relative_change_24h', 0);
  const isPositiveChange = greaterThan(change, 0);

  return (
    <Container>
      <ColumnWithMargins align="start" margin={4}>
        <Title weight="bold">
          {get(asset, 'native.price.display', '$0.00')}
        </Title>
        <Subtitle>CURRENT PRICE</Subtitle>
      </ColumnWithMargins>
      <ColumnWithMargins align="end" margin={4}>
        <RowWithMargins align="center" margin={4}>
          <Icon
            color={isPositiveChange ? colors.chartGreen : colors.red}
            direction={isPositiveChange ? 'left' : 'right'}
            name="fatArrow"
          />
          <Title
            color={isPositiveChange ? colors.chartGreen : colors.red}
            weight="semibold"
          >
            {Math.abs(Number(toFixedDecimals(change, 2)))}%
          </Title>
        </RowWithMargins>
        <Subtitle>TODAY</Subtitle>
      </ColumnWithMargins>
    </Container>
  );
}
