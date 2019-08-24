import { get, map, property } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, PureComponent } from 'react';
import { InteractionManager, View } from 'react-native';
import { compose, mapProps, withProps } from 'recompact';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import {
  withKeyboardFocusHistory,
  withTransitionProps,
  withUniswapAssets,
} from '../hoc';
import { borders, colors, position } from '../styles';
import { isNewValueForPath, safeAreaInsetValues } from '../utils';
import { filterList } from '../utils/search';
import { EmptyAssetList } from '../components/asset-list';
import { ExchangeCoinRow } from '../components/coin-row';
import { ExchangeAssetList, ExchangeSearch } from '../components/exchange';
import GestureBlocker from '../components/GestureBlocker';
import { BackButton } from '../components/header';
import { Centered, Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import { TruncatedText } from '../components/text';
import { exchangeModalBorderRadius } from './ExchangeModal';

const EMPTY_ARRAY = [];

const BackButtonWrapper = styled(Centered)`
  left: 0;
  margin-left: 15;
  position: absolute;
`;

const HeaderContainer = styled(Centered).attrs({ flex: 0 })`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: 60;
  width: 100%;
`;

const HeaderTitle = withProps({
  height: 21,
  letterSpacing: 'tighter',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})(TruncatedText);

const appendAssetWithSearchableKey = (asset) => ({
  ...asset,
  uniqueId: `${asset.name} ${asset.symbol}`,
});

const buildUniqueIdForListData = (items = EMPTY_ARRAY) => items.map(property('address')).join('_');

const normalizeAssetItems = (assetsArray) => map(assetsArray, appendAssetWithSearchableKey);

export const CurrencySelectionTypes = {
  input: 'input',
  output: 'output',
};

class CurrencySelectModal extends PureComponent {
  static propTypes = {
    assetsAvailableOnUniswap: PropTypes.arrayOf(PropTypes.object),
    isFocused: PropTypes.bool,
    isTransitioning: PropTypes.bool,
    navigation: PropTypes.object,
    sortedUniswapAssets: PropTypes.array,
    transitionPosition: PropTypes.object,
    type: PropTypes.oneOf(Object.keys(CurrencySelectionTypes)),
  }

  state = {
    searchQuery: '',
  }

  searchInputRef = React.createRef()

  componentDidUpdate(prevProps) {
    const { isFocused, isTransitioning } = this.props;

    if (isFocused && (!isTransitioning && prevProps.isTransitioning)) {
      if (this.searchInputRef.current) {
        InteractionManager.runAfterInteractions(() => {
          this.searchInputRef.current.focus();
        });
      }
    }
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    const currentTransitioning = this.props.isTransitioning;
    const nextTransitioning = nextProps.isTransitioning;

    // if (currentTransitioning) {
    //   console.log('blocking');
    //   return false;
    // }

    let currentAssets = this.props.sortedUniswapAssets;
    let nextAssets = EMPTY_ARRAY;

    if (nextProps.type === CurrencySelectionTypes.input) {
      currentAssets = this.props.assetsAvailableOnUniswap;
      nextAssets = nextProps.assetsAvailableOnUniswap;
    } else if (nextProps.type === CurrencySelectionTypes.output) {
      nextAssets = nextProps.sortedUniswapAssets;
    }

    const currentAssetsUniqueId = buildUniqueIdForListData(currentAssets);
    const nextAssetsUniqueId = buildUniqueIdForListData(nextAssets);

    const isNewAssets = currentAssetsUniqueId !== nextAssetsUniqueId;
    const isNewFocus = isNewValueForPath(this.props, nextProps, 'isFocused');
    const isNewSearchQuery = isNewValueForPath(this.state, nextState, 'searchQuery');
    const isNewTransitioning = isNewValueForPath(this.props, nextProps, 'isTransitioning');
    const isNewType = isNewValueForPath(this.props, nextProps, 'type');

    return (
      isNewAssets
      || isNewFocus
      || isNewSearchQuery
      || isNewTransitioning
      || isNewType
    );
  }

  dangerouslySetIsGestureBlocked = (isGestureBlocked) => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation.dangerouslyGetParent().setParams({ isGestureBlocked });
  }

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false)

  handleWillFocus = () => this.dangerouslySetIsGestureBlocked(true)

  handlePressBack = () => this.props.navigation.navigate('MainExchangeScreen')

  handleSelectAsset = (item) => {
    const { navigation } = this.props;
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(item)
    // but this small hack seems to be a legit workaround
    const onSelectCurrency = navigation.getParam('onSelectCurrency');
    onSelectCurrency(item);
    navigation.navigate('MainExchangeScreen');
  }

  onChangeSearchText = (searchQuery) => {
    this.setState({ searchQuery });
  }

  renderCurrencyItem = (item) => (
    <ExchangeCoinRow
      item={item}
      onPress={this.handleSelectAsset}
      uniqueId={item.uniqueId}
    />
  )

  handleFocusField = ({ currentTarget }) => {
    this.props.pushKeyboardFocusHistory(currentTarget);
  }

  render = () => {
    const {
      assetsAvailableOnUniswap,
      isFocused,
      isTransitioning,
      sortedUniswapAssets,
      type,
      transitionPosition,
    } = this.props;

    const { searchQuery } = this.state;

    let headerTitle = '';
    let assets = sortedUniswapAssets;
    if (type === CurrencySelectionTypes.input) {
      headerTitle = 'Swap';
      assets = assetsAvailableOnUniswap;
    } else if (type === CurrencySelectionTypes.output) {
      headerTitle = 'Receive';
    }

    const listItems = filterList(assets, searchQuery, 'uniqueId');

    const isLoading = (
      isTransitioning || listItems.length === 0
    );

    // console.log('isFocused', isFocused ? '👍️' : '👎️', ' ', isFocused);

    return (
      <KeyboardFixedOpenLayout>
        <Animated.View
          style={{
            ...position.sizeAsObject('100%'),
            opacity: Animated.interpolate(transitionPosition, {
              extrapolate: 'clamp',
              inputRange: [0, 1],
              outputRange: [0, 1],
            })
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
                <HeaderTitle>
                  {headerTitle}
                </HeaderTitle>
              </HeaderContainer>
              <ExchangeSearch
                autoFocus={false}
                onChangeText={this.onChangeSearchText}
                onFocus={this.handleFocusField}
                ref={this.searchInputRef}
              />
              <View flex={1}>
                <ExchangeAssetList
                  items={listItems}
                  renderItem={this.renderCurrencyItem}
                  scrollIndicatorInsets={{
                    bottom: exchangeModalBorderRadius,
                  }}
                />
                <EmptyAssetList
                  {...position.coverAsObject}
                  backgroundColor={colors.white}
                  opacity={isLoading ? 1 : 0}
                  pointerEvents="none"
                />
              </View>
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
  withUniswapAssets,
  mapProps(({
    assetsAvailableOnUniswap,
    navigation,
    sortedUniswapAssets,
    tabsTransitionProps: { isTransitioning },
    ...props,
  }) => ({
    ...props,
    assetsAvailableOnUniswap: normalizeAssetItems(assetsAvailableOnUniswap),
    isTransitioning,
    navigation,
    sortedUniswapAssets: normalizeAssetItems(sortedUniswapAssets),
    transitionPosition: get(navigation, 'state.params.position'),
    type: get(navigation, 'state.params.type', null),
  })),
)(CurrencySelectModal);
