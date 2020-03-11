import { produce } from 'immer';
import { concat, get, isEmpty, map } from 'lodash';
import matchSorter from 'match-sorter';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  NavigationEvents,
  withNavigation,
  withNavigationFocus,
} from 'react-navigation';
import { compose, mapProps } from 'recompact';
import { withUniswapAssets } from '../hoc';
import { position } from '../styles';
import { isNewValueForObjectPaths } from '../utils';
import { filterList, filterScams } from '../utils/search';
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

const appendAssetWithUniqueId = asset => ({
  ...asset,
  uniqueId: `${asset.address}`,
});

const normalizeAssetItems = assetsArray =>
  map(assetsArray, appendAssetWithUniqueId);

const headerlessSection = data => [{ data, title: '' }];

export const CurrencySelectionTypes = {
  input: 'input',
  output: 'output',
};

class CurrencySelectModal extends Component {
  static propTypes = {
    curatedAssets: PropTypes.array,
    favorites: PropTypes.array,
    globalHighLiquidityAssets: PropTypes.array,
    globalLowLiquidityAssets: PropTypes.array,
    navigation: PropTypes.object,
    transitionPosition: PropTypes.object,
    type: PropTypes.oneOf(Object.keys(CurrencySelectionTypes)),
    uniswapAssetsInWallet: PropTypes.arrayOf(PropTypes.object),
  };

  state = {
    assetsToFavoriteQueue: {},
    isFocused: false,
    searchQuery: '',
    searchQueryForSearch: '',
  };

  static getDerivedStateFromProps(props, state) {
    const isFocused = props.navigation.isFocused();
    return { ...state, isFocused };
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewType = this.props.type !== nextProps.type;

    const isFocused = this.state.isFocused;
    const willBeFocused = nextState.isFocused;

    if (!isFocused && willBeFocused) {
      this.handleWillFocus();
    } else if (isFocused && !willBeFocused) {
      this.handleWillBlur();
      InteractionManager.runAfterInteractions(() => {
        this.handleDidBlur();
        this.props.navigation.state.params.restoreFocusOnSwapModal();
      });
    }

    const isNewProps = isNewValueForObjectPaths(
      { ...this.props, isFocused },
      { ...nextProps, isFocused: willBeFocused },
      ['isFocused', 'type', 'globalHighLiquidityAssets']
    );

    const isNewState = isNewValueForObjectPaths(this.state, nextState, [
      'searchQuery',
      'searchQueryForSearch',
      'assetsToFavoriteQueue',
    ]);

    return isNewType || isNewProps || isNewState;
  };

  debounceHandler = null;

  dangerouslySetIsGestureBlocked = isGestureBlocked => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation
      .dangerouslyGetParent()
      .setParams({ isGestureBlocked });
  };

  handleChangeSearchQuery = searchQuery => {
    // When searching for the input field
    // or clearing the search no need for debouncing
    this.setState({ searchQuery }, () => {
      if (this.debounceHandler) clearTimeout(this.debounceHandler);
      this.debounceHandler = setTimeout(
        () => {
          this.setState({
            searchQueryForSearch: searchQuery,
          });
        },
        searchQuery === '' ? 1 : 250
      );
    });
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
      curatedAssets,
      favorites,
      globalHighLiquidityAssets,
      globalLowLiquidityAssets,
      isInitialized,
      transitionPosition,
      type,
      uniswapAssetsInWallet,
    } = this.props;

    if (type === null || type === undefined) {
      return null;
    }

    const { searchQuery, searchQueryForSearch } = this.state;

    let headerTitle = '';
    let filteredList = [];
    if (type === CurrencySelectionTypes.input) {
      headerTitle = 'Swap';
      filteredList = headerlessSection(uniswapAssetsInWallet);
      if (!isEmpty(searchQueryForSearch)) {
        filteredList = filterList(
          uniswapAssetsInWallet,
          searchQueryForSearch,
          ['symbol', 'name'],
          { threshold: matchSorter.rankings.CONTAINS }
        );
        filteredList = headerlessSection(filteredList);
      }
    } else if (type === CurrencySelectionTypes.output) {
      headerTitle = 'Receive';
      const curatedSection = concat(favorites, curatedAssets);
      if (!isEmpty(searchQueryForSearch)) {
        const [filteredBest, filteredHigh, filteredLow] = map(
          [curatedSection, globalHighLiquidityAssets, globalLowLiquidityAssets],
          section => {
            return filterList(
              section,
              searchQueryForSearch,
              ['symbol', 'name'],
              { threshold: matchSorter.rankings.CONTAINS }
            );
          }
        );

        filteredList = [];

        filteredBest.length &&
          filteredList.push({ data: filteredBest, title: '' });

        const filteredHighWithoutScams = filterScams(
          filteredBest,
          filteredHigh
        );

        filteredHighWithoutScams.length &&
          filteredList.push({
            data: filteredHighWithoutScams,
            title: filteredBest.length ? 'MORE RESULTS' : '',
          });

        const filteredLowWithoutScams = filterScams(filteredBest, filteredLow);
        filteredLowWithoutScams.length &&
          filteredList.push({
            data: filteredLowWithoutScams,
            title: 'LOW LIQUIDITY',
          });
      } else {
        filteredList = headerlessSection(concat(favorites, curatedAssets));
      }
    }

    const isFocused = this.props.navigation.isFocused();
    const loading = !isInitialized;

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
                listItems={filteredList}
                showList={isFocused}
                type={type}
                query={searchQueryForSearch}
                loading={loading}
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
  withNavigation,
  withUniswapAssets,
  mapProps(
    ({
      curatedAssets,
      favorites,
      globalHighLiquidityAssets,
      globalLowLiquidityAssets,
      isInitialized,
      navigation,
      ...props
    }) => ({
      ...props,
      curatedAssets: normalizeAssetItems(curatedAssets),
      favorites: normalizeAssetItems(favorites),
      globalHighLiquidityAssets: normalizeAssetItems(globalHighLiquidityAssets),
      globalLowLiquidityAssets: normalizeAssetItems(globalLowLiquidityAssets),
      isInitialized,
      navigation,
      transitionPosition: get(navigation, 'state.params.position'),
      type: get(navigation, 'state.params.type', null),
    })
  )
)(CurrencySelectModal);
