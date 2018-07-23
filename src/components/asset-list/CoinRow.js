import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import Column from '../layout/Column';
import Row from '../layout/Row';
import { padding } from '../../styles';
import CoinIcon from '../CoinIcon';

const Container = styled(Row)`
  ${padding(12, 19, 12, 15)}
`;

const Content = styled(Column)`
  flex: 1;
  height: 40;
  margin-left: 12px;
`;

const CoinRow = ({
  address,
  balance,
  bottomRowRender,
  native,
  name,
  symbol,
  topRowRender,
}) => (
  console.log('<CoinIcon symbol={symbol} />', <CoinIcon symbol={symbol} />),
  <Container align="center">
    <CoinIcon symbol={symbol} />
    <Content justify="space-between">
      <Row align="center" justify="space-between">
        {topRowRender({
          address,
          balance,
          native,
          name,
          symbol,
        })}
      </Row>
      <Row align="center" justify="space-between">
        {bottomRowRender({
          address,
          balance,
          native,
          name,
          symbol,
        })}
      </Row>
    </Content>
  </Container>
);

CoinRow.propTypes = {
  address: PropTypes.string,
  balance: PropTypes.object,
  native: PropTypes.object,
  bottomRowRender: PropTypes.func,
  name: PropTypes.string,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

export default CoinRow;
