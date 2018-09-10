import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import Column from '../layout/Column';
import Row from '../layout/Row';
import { colors, padding } from '../../styles';
import CoinIcon from '../CoinIcon';

const CoinRowPaddingVertical = 12;

const Container = styled(Row)`
  ${padding(CoinRowPaddingVertical, 19, CoinRowPaddingVertical, 15)}
  background-color: ${colors.white};
`;

const Content = styled(Column)`
  flex: 1;
  height: ${CoinIcon.height};
  margin-left: ${CoinRowPaddingVertical};
`;

const CoinRow = pure(({
  bottomRowRender,
  symbol,
  topRowRender,
  ...props
}) => (
  <Container align="center">
    <CoinIcon symbol={symbol} />
    <Content justify="space-between">
      <Row align="center" justify="space-between">
        {topRowRender({ symbol, ...props })}
      </Row>
      <Row align="center" justify="space-between">
        {bottomRowRender({ symbol, ...props })}
      </Row>
    </Content>
  </Container>
));

CoinRow.propTypes = {
  bottomRowRender: PropTypes.func,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.height = CoinIcon.height + (CoinRowPaddingVertical * 2);

export default CoinRow;
