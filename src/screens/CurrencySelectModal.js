import {
  filter,
  findIndex,
  get,
  isEmpty,
  keys,
  map,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose, withHandlers } from 'recompact';
import { InteractionManager, KeyboardAvoidingView, View } from 'react-native'
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Centered, Column, FlexItem, KeyboardFixedOpenLayout, Row } from '../components/layout';
import { deviceUtils, safeAreaInsetValues } from '../utils';
import { Modal, ModalHeader } from '../components/modal';
import { RecyclerAssetList } from '../components/asset-list';
import { ExchangeCoinRow, SendCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { Monospace, TruncatedText } from '../components/text';
import {
  withAccountData,
  withKeyboardFocusHistory,
  withTransitionProps,
  withUniswapAssets,
} from '../hoc';
import { borders, colors, position } from '../styles';
import { BackButton } from '../components/header';
import { ExchangeSearch } from '../components/exchange';
import { filterList } from '../utils/search';
import { exchangeModalBorderRadius } from './ExchangeModal';

const HeaderContainer = styled(Centered).attrs({
  flex: 0,
})`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: 60;
  width: 100%;
`;

const BackButtonWrapper = styled(Centered)`
  left: 0;
  margin-left: 15;
  position: absolute;
`;

class CurrencySelectModal extends PureComponent {
  static propTypes = {
    navigation: PropTypes.object,
  }

  state = {
    searchResults: [],
  }

  assets = []

  callback = null

  isInputAssets = true

  onChangeSearchText = (searchPhrase) => {
    const searchResults = filterList(this.assets, searchPhrase, 'index');
    this.setState({ searchResults });
  }

  searchInputRef = React.createRef()

  componentDidMount() {
    this.getDataFromParams();
  }

  componentDidUpdate(prevProps) {
    const {
      isFocused,
      keyboardFocusHistory,
      transitionProps: { isTransitioning },
    } = this.props;

    const prevTransitioning = get(prevProps, 'transitionProps.isTransitioning');

    if (isFocused && (!isTransitioning && prevTransitioning)) {
      this.searchInputRef.current.focus();
    }

    this.callback = navigation.getParam('onSelectCurrency');
    this.isInputAssets = navigation.getParam('isInputAssets');

    this.getDataFromParams();
  }

  getDataFromParams = () => {
    const { navigation } = this.props;
    this.callback = navigation.getParam('onSelectCurrency');
    const assets = navigation.getParam('assets') || [];
    const indexedAssets = map(assets, asset => ({ ...asset, index: `${asset.name} ${asset.symbol}` }));
    this.assets = indexedAssets;
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
    <ExchangeCoinRow
      {...itemProps}
      onPress={this.handleSelectAsset}
    />
  )

  handleFocusField = ({ currentTarget }) => {
    this.props.pushKeyboardFocusHistory(currentTarget);
  }

  getSections = () => {
    const data = (this.state.searchResults) ? this.assets : this.state.searchResults;
    return [{
      balances: true,
      data,
      renderItem: this.renderCurrencyItem,
    }];
  }


  render() {
    const {
      allAssets,
      navigation,
      transitionProps: { isTransitioning },
    } = this.props;

    return (
      <KeyboardFixedOpenLayout paddingTop={safeAreaInsetValues.top}>
        <Animated.View
          style={{
            ...position.sizeAsObject('100%'),
            opacity: Animated.interpolate(navigation.getParam('position'), {
              extrapolate: 'clamp',
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }}
        >
          <Modal
            containerPadding={0}
            height="100%"
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
                    size="9"
                  />
                </BackButtonWrapper>
                <TruncatedText
                  height={21}
                  letterSpacing="tighter"
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  Receive
                </TruncatedText>
              </HeaderContainer>
              <ExchangeSearch
                autoFocus={false}
                onChangeText={this.onChangeSearchText}
                onFocus={this.handleFocusField}
                ref={this.searchInputRef}
              />
              <RecyclerAssetList
                flex={0}
                hideHeader
                paddingBottom={100}
                sections={this.getSections()}
              />
            </Column>
            <GestureBlocker type='bottom'/>
          </Modal>
        </Animated.View>
      </KeyboardFixedOpenLayout>
    );
  }
}

export default compose(
  withNavigationFocus,
  withTransitionProps,
  withKeyboardFocusHistory,
)(CurrencySelectModal);
