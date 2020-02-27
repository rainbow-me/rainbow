import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { View } from 'react-native';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import {
  withAccountSettings,
  withFabSendAction,
  withEditOptions,
} from '../../hoc';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import Highlight from '../Highlight';
import { Column, Row } from '../layout';
import TransitionToggler from '../animations/TransitionToggler';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const CoinRowPaddingTop = 15;
const CoinRowPaddingBottom = 7;

const Container = styled(Row)`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom, 19)}
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

const enhance = compose(withAccountSettings, withFabSendAction);

const CoinRow = enhance(
  ({
    bottomRowRender,
    children,
    coinIconRender,
    containerStyles,
    contentStyles,
    highlight,
    symbol,
    isCoin,
    isCoinListEdited,
    isSmall,
    topRowRender,
    ...props
  }) => {
    const coinRow = (
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
        {typeof children === 'function'
          ? children({ symbol, ...props })
          : children}
      </Container>
    );

    return isSmall || !isCoin ? (
      coinRow
    ) : (
      <>
        <View
          style={{
            height: CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom,
            paddingTop: 10,
            position: 'absolute',
            width: 66,
          }}
        >
          <ButtonPressAnimation>
            <View
              style={{
                alignItems: 'center',
                height: '100%',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {/* <View
              style={{
                borderColor: colors.blueGreyDarkTransparent,
                borderRadius: 11,
                borderWidth: 1.5,
                height: 22,
                opacity: 0.15,
                width: 22,
              }}
            /> */}
              <View
                style={{
                  backgroundColor: colors.appleBlue,
                  borderRadius: 11,
                  height: 22,
                  padding: 4.5,
                  shadowColor: colors.appleBlue,
                  shadowOffset: {
                    height: 4,
                    width: 0,
                  },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  width: 22,
                }}
              >
                <Icon name="checkmark" color="white" />
              </View>
            </View>
          </ButtonPressAnimation>
        </View>
        <TransitionToggler
          startingWidth={0}
          endingWidth={35}
          toggle={isCoinListEdited}
        >
          {coinRow}
        </TransitionToggler>
      </>
    );
  }
);

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

export default compose(withEditOptions)(CoinRow);
