import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import {
  withAccountSettings,
  withCoinListEdited,
  withEditOptions,
  withFabSendAction,
} from '../../hoc';
import { padding } from '../../styles';
import Highlight from '../Highlight';
import { CoinIcon, CoinIconSize } from '../coin-icon';
import { Column, Row } from '../layout';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const Container = styled(Row).attrs({ align: 'center' })`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom)};
  width: 100%;
`;

const Content = styled(Column).attrs({ justify: 'space-between' })`
  flex: 1;
  height: ${CoinIconSize};
  margin-left: 10;
`;

const enhance = compose(
  withAccountSettings,
  withFabSendAction,
  withEditOptions,
  withCoinListEdited
);

const CoinRow = enhance(
  ({
    bottomRowRender,
    children,
    coinIconRender,
    containerStyles,
    contentStyles,
    highlight,
    symbol,
    address,
    topRowRender,
    isCoinListEdited,
    isHidden,
    isPinned,
    ...props
  }) => (
    <Container style={containerStyles}>
      <Highlight
        borderRadius={18}
        margin={2}
        marginHorizontal={8}
        visible={highlight}
      />
      {createElement(coinIconRender, {
        address,
        isCoinListEdited,
        isHidden,
        isPinned,
        symbol,
        ...props,
      })}
      <Row flex={1} opacity={isHidden ? 0.4 : 1}>
        <Content style={contentStyles}>
          <Row align="center" justify="space-between">
            {topRowRender({ symbol, ...props })}
          </Row>
          <Row align="center" justify="space-between" marginBottom={0.5}>
            {bottomRowRender({ symbol, ...props })}
          </Row>
        </Content>
      </Row>
      {typeof children === 'function'
        ? children({ symbol, ...props })
        : children}
    </Container>
  )
);

CoinRow.propTypes = {
  address: PropTypes.string,
  bottomRowRender: PropTypes.func,
  children: PropTypes.node,
  coinIconRender: PropTypes.func,
  containerStyles: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  contentStyles: PropTypes.string,
  highlight: PropTypes.bool,
  isCoinListEdited: PropTypes.bool,
  onPress: PropTypes.func,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.defaultProps = {
  coinIconRender: CoinIcon,
};

CoinRow.height = CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom;

export default CoinRow;
