import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountSettings, withFabSendAction } from '../../hoc';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import Highlight from '../Highlight';
import { Column, Row } from '../layout';

const CoinRowPaddingTop = 15;
const CoinRowPaddingBottom = 7;

const Container = styled(Row)`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom, 15)}
  background-color: ${colors.white};
  width: 100%;
`;

const Content = styled(Column)`
  height: ${CoinIcon.size};
  margin-left: 10;
`;

const enhance = compose(
  withAccountSettings,
  withFabSendAction,
);

const CoinRow = enhance(({
  bottomRowRender,
  children,
  coinIconRender,
  containerStyles,
  contentStyles,
  highlight,
  symbol,
  topRowRender,
  ...props
}) => (
  <Container align="center" css={containerStyles} color="red">
    <Highlight highlight={highlight}/>
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
));

CoinRow.propTypes = {
  bottomRowRender: PropTypes.func,
  children: PropTypes.node,
  coinIconRender: PropTypes.func,
  containerStyles: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  contentStyles: PropTypes.string,
  highlight: PropTypes.bool,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.defaultProps = {
  coinIconRender: CoinIcon,
};

CoinRow.height = CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom;


export default CoinRow;
