import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { compose, withHandlers } from 'recompact';
import { View } from 'react-native'
import { NavigationEvents } from 'react-navigation';
import styled from 'styled-components/primitives';
import { Column, FlexItem, Row } from '../components/layout';
import { Modal, ModalHeader } from '../components/modal';
import AssetList from '../components/asset-list/RecyclerAssetList';
import { SendCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { Monospace, TruncatedText } from '../components/text';
import { withAccountData } from '../hoc';
import { borders, colors } from '../styles';
import StarIcon from '../components/icons/svg/StarIcon';
import { ModalHeaderHeight } from '../components/modal/ModalHeader';
import { BackButton } from '../components/header';
import Flex from '../components/layout/Flex';
import { exchangeModalBorderRadius } from './ExchangeModal';

const HeaderContainer = styled(Row).attrs({
  align: 'center',
  flex: 0,
  justify: 'center',
})`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: ${ModalHeaderHeight};
  width: 100%;
`;

const BackButtonWrapper = styled(Flex).attrs({
  align: 'center',
  justify: 'center',
})`
  left: 0;
  position: absolute;
  margin-left: 15;
`;

const BottomRow = ({ balance, symbol }) => (
  <Monospace
    color={colors.alpha(colors.blueGreyDark, 0.6)}
    size="smedium"
  >
    {symbol}
  </Monospace>
);

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  symbol: PropTypes.string,
};

const StarRender = ({ favorite }) => (
  <FlexItem flex={0} style={{ marginLeft: 8 }}>
    <StarIcon color={favorite ? colors.orangeLight : colors.grey} />
  </FlexItem>
);

StarRender.propTypes = {
  favorite: PropTypes.bool,
};

const CurrencyRenderItem = ({ item, onPress }) => (
  <SendCoinRow
    {...item}
    bottomRowRender={BottomRow}
    onPress={onPress}
    starRender={StarRender}
  />
);

CurrencyRenderItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.shape({ symbol: PropTypes.string }),
  onPress: PropTypes.func,
};

const EnhancedCurrencyRenderItem = withHandlers({
  onPress: ({ item: { symbol }, onPress }) => () => onPress(symbol),
})(CurrencyRenderItem);

class SelectCurrencyModal extends Component {
  static propTypes = {
    allAssets: PropTypes.array,
    navigation: PropTypes.object,
  }

  callback = null

  componentDidMount() {
    this.callback = this.props.navigation.getParam('onSelectCurrency');
  }

  componentDidUpdate() {
    this.callback = this.props.navigation.getParam('onSelectCurrency');
  }

  dangerouslySetIsGestureBlocked = (isGestureBlocked) => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation.dangerouslyGetParent().setParams({ isGestureBlocked });
  }

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false)

  handleWillFocus = () => this.dangerouslySetIsGestureBlocked(true)

  handlePressBack = () => this.props.navigation.navigate('MainExchangeScreen')

  handleSelectAsset = (symbol) => {
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(symbol)
    // but this small hack seems to be a legit workaround
    this.callback(symbol);
    this.props.navigation.navigate('MainExchangeScreen');
  }

  renderCurrencyItem = (itemProps) => (
    <EnhancedCurrencyRenderItem
      {...itemProps}
      onPress={this.handleSelectAsset}
    />
  )

  render() {
    const fakeDataThatNeedsToBeHookedUp = [
      {
        balances: true,
        data: this.props.allAssets,
        renderItem: this.renderCurrencyItem,
      },
    ];

    return (
      <Modal
        containerPadding={4}
        minHeight={580}
        overflow="hidden"
        radius={exchangeModalBorderRadius}
      >
        <GestureBlocker type='top'/>
        <NavigationEvents
          onWillBlur={this.handleWillBlur}
          onWillFocus={this.handleWillFocus}
        />
        <Column flex={1}>
          <HeaderContainer>
            <BackButtonWrapper>
              <BackButton
                color={colors.black}
                direction="left"
                onPress={this.handlePressBack}
                size='8'
              />
            </BackButtonWrapper>
            <TruncatedText
              height={21}
              letterSpacing="tight"
              size="large"
              weight="bold"
            >
              Receive
            </TruncatedText>
          </HeaderContainer>
          <AssetList
            hideHeader
            sections={fakeDataThatNeedsToBeHookedUp}
          />
        </Column>
        <GestureBlocker type='bottom'/>
      </Modal>
    );
  }
}

export default compose(
  withAccountData,
)(SelectCurrencyModal);
