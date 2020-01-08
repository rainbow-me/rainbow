import { get, map, property } from 'lodash';
import PropTypes from 'prop-types';
import { produce } from 'immer';
import React, { Component } from 'react';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, mapProps } from 'recompact';
import { withUniswapAssets } from '../hoc';
import { position } from '../styles';
import { isNewValueForObjectPaths } from '../utils';
import { filterList } from '../utils/search';
import { interpolate } from '../components/animations';
import {
  CurrencySelectionList,
  CurrencySelectModalHeader,
  ExchangeSearch,
} from '../components/exchange';
import GestureBlocker from '../components/GestureBlocker';
import { Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import { exchangeModalBorderRadius } from './ExchangeModal';

const EMPTY_ARRAY = [];

const appendAssetWithSearchableKey = asset => ({
  ...asset,
  uniqueId: `${asset.name} ${asset.symbol}`,
});

const buildUniqueIdForListData = (items = EMPTY_ARRAY) =>
  items.map(property('address')).join('_');

const normalizeAssetItems = assetsArray =>
  map(assetsArray, appendAssetWithSearchableKey);

export const CurrencySelectionTypes = {
  input: 'input',
  output: 'output',
};

class CurrencySelectModal extends Component {
  static propTypes = {
    assetsAvailableOnUniswap: PropTypes.arrayOf(PropTypes.object),
    isFocused: PropTypes.bool,
    navigation: PropTypes.object,
    sortedUniswapAssets: PropTypes.array,
    transitionPosition: PropTypes.object,
    type: PropTypes.oneOf(Object.keys(CurrencySelectionTypes)),
  };

  state = {
    assetsToFavoriteQueue: {},
    searchQuery: '',
  };

  shouldComponentUpdate = (nextProps, nextState) => {
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

    const isNewProps = isNewValueForObjectPaths(this.props, nextProps, [
      'isFocused',
      'type',
    ]);

    const isNewState = isNewValueForObjectPaths(this.state, nextState, [
      'searchQuery',
      'assetsToFavoriteQueue',
    ]);

    return isNewAssets || isNewProps || isNewState;
  };

  dangerouslySetIsGestureBlocked = isGestureBlocked => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation
      .dangerouslyGetParent()
      .setParams({ isGestureBlocked });
  };

  handleChangeSearchQuery = searchQuery => {
    this.setState({ searchQuery });
  };

  handleFavoriteAsset = (assetAddress, isFavorited) => {
    this.setState(
      produce(draft => {
        draft.assetsToFavoriteQueue[assetAddress] = isFavorited;
      })
    );
  };

  handlePressBack = () => {
    this.props.navigation.navigate('MainExchangeScreen');
  };

  handleSelectAsset = item => {
    const { navigation } = this.props;
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(item)
    // but this small hack seems to be a legit workaround
    const onSelectCurrency = navigation.getParam('onSelectCurrency');
    onSelectCurrency(item);
    navigation.navigate('MainExchangeScreen');
  };

  handleDidBlur = () => {
    const { uniswapUpdateFavorites } = this.props;
    const { assetsToFavoriteQueue } = this.state;

    Object.keys(assetsToFavoriteQueue).map(assetToFavorite =>
      uniswapUpdateFavorites(
        assetToFavorite,
        assetsToFavoriteQueue[assetToFavorite]
      )
    );

    this.handleChangeSearchQuery('');
  };

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false);

  handleWillFocus = () => {
    this.dangerouslySetIsGestureBlocked(true);
    if (this.searchInputRef.current) {
      this.searchInputRef.current.focus();
    }
  };

  searchInputRef = React.createRef();

  render = () => {
    const {
      assetsAvailableOnUniswap,
      isFocused,
      sortedUniswapAssets,
      transitionPosition,
      type,
    } = this.props;

    if (type === null || type === undefined) {
      return null;
    }

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

    return (
      <KeyboardFixedOpenLayout>
        <Animated.View
          style={{
            ...position.sizeAsObject('100%'),
            opacity: interpolate(transitionPosition, {
              extrapolate: Animated.Extrapolate.CLAMP,
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
            <GestureBlocker type="top" />
            <NavigationEvents
              onDidBlur={this.handleDidBlur}
              onWillBlur={this.handleWillBlur}
              onWillFocus={this.handleWillFocus}
            />
            <Column flex={1}>
              <CurrencySelectModalHeader
                onPressBack={this.handlePressBack}
                title={headerTitle}
              />
              <ExchangeSearch
                autoFocus={false}
                onChangeText={this.handleChangeSearchQuery}
                ref={this.searchInputRef}
                searchQuery={searchQuery}
              />
              <CurrencySelectionList
                itemProps={{
                  onFavoriteAsset: this.handleFavoriteAsset,
                  onPress: this.handleSelectAsset,
                  showBalance: type === CurrencySelectionTypes.input,
                  showFavoriteButton: type === CurrencySelectionTypes.output,
                }}
                listItems={listItems}
                showList={isFocused}
                type={type}
              />
            </Column>
            <GestureBlocker type="bottom" />
          </Modal>
        </Animated.View>
      </KeyboardFixedOpenLayout>
    );
  };
}

export default compose(
  withNavigationFocus,
  withUniswapAssets,
  mapProps(
    ({
      assetsAvailableOnUniswap,
      navigation,
      sortedUniswapAssets,
      ...props
    }) => ({
      ...props,
      assetsAvailableOnUniswap: normalizeAssetItems(assetsAvailableOnUniswap),
      navigation,
      sortedUniswapAssets: normalizeAssetItems(sortedUniswapAssets),
      transitionPosition: get(navigation, 'state.params.position'),
      type: get(navigation, 'state.params.type', null),
    })
  )
)(CurrencySelectModal);
