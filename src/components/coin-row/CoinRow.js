import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { StyleSheet } from 'react-native';
import { compose, omitProps, onlyUpdateForKeys, pure, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import connect from 'react-redux/es/connect/connect';
import { withAccountSettings } from '../../hoc';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import Flex from '../layout/Row';
import selectedWithFab from '../../redux/selectedWithFab';

const CoinRowPaddingVertical = 12;

const Container = styled(Row)`
  ${padding(CoinRowPaddingVertical, 19, CoinRowPaddingVertical, 15)}
  background-color: ${colors.white};
  width: 100%;
`;

const Content = styled(Column)`
  height: ${CoinIcon.size};
  margin-left: ${CoinRowPaddingVertical};
`;

const Highlight = styled(Flex)`
 left: 0;
 top: 0;
 right: 0;
 bottom: 0;
  position: absolute;
  margin: 7px;
  background-color: ${colors.lightestGrey};
  border-radius: 10;
`;

const mapStateToProps = ({
                           selectedWithFab: {
                             selectedId,
                           },
                         }) => ({
  selectedId,
});

const enhance = compose(
  connect(mapStateToProps),
  withProps(({ selectedId, uniqueId }) => ({ highlight: selectedId === uniqueId })),
  omitProps('selectedId'),
  withAccountSettings,
  pure,
);

const CoinRow = enhance(({
  bottomRowRender,
  children,
  coinIconRender,
  containerStyles,
  contentStyles,
  highlight,
  selectedId,
  onPress,
  symbol,
  topRowRender,
  ...props
}) => (
  <Container align="center" css={containerStyles} color="red">
    {highlight && <Highlight/>}
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
  onPress: PropTypes.func,
  symbol: PropTypes.string,
  topRowRender: PropTypes.func,
};

CoinRow.defaultProps = {
  coinIconRender: CoinIcon,
};

CoinRow.height = CoinIcon.size + (CoinRowPaddingVertical * 2);


export default CoinRow;
