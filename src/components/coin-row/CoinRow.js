import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import {
  withAccountSettings,
  withCoinListEdited,
  withFabSendAction,
  withEditOptions,
} from '../../hoc';
import { padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import Highlight from '../Highlight';
import { Column, Row } from '../layout';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const Container = styled(Row)`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom, 19)}
  width: 100%;
`;

const OpacityWrapper = styled(Row)`
  flex: 1;
`;

const Content = styled(Column).attrs({
  flex: 1,
  justify: 'space-between',
})`
  height: ${CoinIcon.size};
  margin-left: 10;
`;

const CoinRowHighlight = withProps({
  borderRadius: 18,
  margin: 2,
  marginHorizontal: 8,
})(Highlight);

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
    <Container align="center" css={containerStyles}>
      <CoinRowHighlight visible={highlight} />
      {createElement(coinIconRender, {
        address,
        isCoinListEdited,
        isHidden,
        isPinned,
        symbol,
        ...props,
      })}
      <OpacityWrapper style={{ opacity: isHidden ? 0.4 : 1 }}>
        <Content css={contentStyles}>
          <Row align="center" justify="space-between">
            {topRowRender({ symbol, ...props })}
          </Row>
          <Row align="center" justify="space-between" marginBottom={0.5}>
            {bottomRowRender({ symbol, ...props })}
          </Row>
        </Content>
      </OpacityWrapper>
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

CoinRow.height = CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom;

export default CoinRow;
