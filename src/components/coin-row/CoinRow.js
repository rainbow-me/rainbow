import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import {
  compose,
  pure,
  setStatic,
} from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountSettings } from '../../hoc';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';

const CoinRowPaddingVertical = 12;

const Container = styled(Row)`
  ${padding(CoinRowPaddingVertical, 19, CoinRowPaddingVertical, 15)}
  background-color: ${colors.white};
  width: 100%;
`;

const Content = styled(Column)`
  background-color: ${colors.white};
  height: ${CoinIcon.size};
  margin-left: ${CoinRowPaddingVertical};
`;

const CoinRow = ({
  bottomRowRender,
  children,
  coinIconRender,
  containerStyles,
  contentStyles,
  onPress,
  symbol,
  topRowRender,
  ...props
}) => (
  <Container align="center" css={containerStyles}>
    {createElement(coinIconRender, { symbol, ...props })}
    <Content flex={1} justify="space-between" css={contentStyles}>
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
);

CoinRow.propTypes = {
  bottomRowRender: PropTypes.func,
  children: PropTypes.node,
  coinIconRender: PropTypes.func,
  containerStyles: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  contentStyles: PropTypes.string,
  onPress: PropTypes.func,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.defaultProps = {
  coinIconRender: CoinIcon,
};

export default compose(
  pure,
  setStatic({ height: CoinIcon.size + (CoinRowPaddingVertical * 2) }),
  withAccountSettings,
)(CoinRow);
