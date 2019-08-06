import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountSettings, withFabSendAction } from '../../hoc';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import Highlight from '../Highlight';
import { Column, Row } from '../layout';

const CoinRowPaddingTop = 10;
const CoinRowPaddingBottom = 11.5;

const Container = styled(Row)`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom, 15)}
  background-color: ${colors.white};
  width: 100%;
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
);

const CoinRow = enhance(({
  bottomRowRender,
  children,
  coinIconRender,
  containerStyles,
  contentStyles,
  highlight,
  onPress,
  symbol,
  topRowRender,
  ...props
}) => (
  <Container align="center" css={containerStyles}>
    <CoinRowHighlight visible={highlight} />
    {createElement(coinIconRender, { symbol, ...props })}
    <Content css={contentStyles}>
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
  onPress: PropTypes.func,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.defaultProps = {
  coinIconRender: CoinIcon,
};

CoinRow.height = CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom;

export default CoinRow;
