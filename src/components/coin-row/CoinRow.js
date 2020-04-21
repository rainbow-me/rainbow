import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { StyleSheet } from 'react-native';
import { compose } from 'recompact';
import {
  withAccountSettings,
  withCoinListEdited,
  withEditOptions,
  withFabSendAction,
} from '../../hoc';
import Highlight from '../Highlight';
import { CoinIcon, CoinIconSize } from '../coin-icon';
import { Column, Row } from '../layout';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const sx = StyleSheet.create({
  container: {
    paddingBottom: CoinRowPaddingBottom,
    paddingHorizontal: 19,
    paddingTop: CoinRowPaddingTop,
    width: '100%',
  },
  content: {
    height: CoinIconSize,
    marginLeft: 10,
  },
});

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
    <Row align="center" style={[sx.container, containerStyles]}>
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
        <Column
          flex={1}
          justify="space-between"
          style={[sx.content, contentStyles]}
        >
          <Row align="center" justify="space-between">
            {topRowRender({ symbol, ...props })}
          </Row>
          <Row align="center" justify="space-between" marginBottom={0.5}>
            {bottomRowRender({ symbol, ...props })}
          </Row>
        </Column>
      </Row>
      {typeof children === 'function'
        ? children({ symbol, ...props })
        : children}
    </Row>
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
