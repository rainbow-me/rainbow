import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';

const CoinRowPaddingVertical = 12;

const Container = styled(Row)`
  ${padding(CoinRowPaddingVertical, 19, CoinRowPaddingVertical, 15)}
  background-color: ${colors.white};
  ${({ containerStyles }) => containerStyles}
`;

const Content = styled(Column)`
  flex: 1;
  height: ${CoinIcon.size};
  margin-left: ${CoinRowPaddingVertical};
  ${({ contentStyles }) => contentStyles}
`;

const CoinRow = pure(({
  bottomRowRender,
  children,
  coinIconRender,
  containerStyles,
  contentStyles,
  symbol,
  topRowRender,
  ...props
}) => (
  <Container align="center" styles={containerStyles}>
    {createElement(coinIconRender, { symbol, ...props })}
    <Content justify="space-between" styles={contentStyles}>
      <Row align="center" justify="space-between">
        {topRowRender({ symbol, ...props })}
      </Row>
      <Row align="center" justify="space-between">
        {bottomRowRender({ symbol, ...props })}
      </Row>
    </Content>
    {(typeof children === 'function')
      ? children({ symbol, ...props })
      : children
    }
  </Container>
));

CoinRow.propTypes = {
  bottomRowRender: PropTypes.func,
  coinIconRender: PropTypes.func,
  children: PropTypes.node,
  containerStyles: PropTypes.string,
  contentStyles: PropTypes.string,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.defaultProps = {
  coinIconRender: CoinIcon,
};

CoinRow.height = CoinIcon.size + (CoinRowPaddingVertical * 2);

export default CoinRow;
