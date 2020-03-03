import { concat, get, isEmpty, map } from 'lodash';
import PropTypes from 'prop-types';
import { produce } from 'immer';
import React, { Component } from 'react';
import { InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
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
import matchSorter from 'match-sorter';

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
    uniswapGetAllExchanges: PropTypes.func,
  };

  state = {
    assetsToFavoriteQueue: {},
    isSearching: false,
    searchQuery: '',
    searchQueryForSearch: '',
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.uniswapGetAllExchanges();
    });
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewType = this.props.type !== nextProps.type;

    const isFocused = this.props.navigation.getParam('focused', false);
    const willBeFocused = nextProps.navigation.getParam('focused', false);

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
      ['isFocused', 'type']
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
    this.setState({ isSearching: true, searchQuery }, () => {
      if (this.debounceHandler) clearTimeout(this.debounceHandler);
      this.debounceHandler = setTimeout(() => {
        this.setState({
          isSearching: false,
          searchQueryForSearch: searchQuery,
        });
      }, 150);
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
      favorites,
      globalHighLiquidityAssets,
      globalLowLiquidityAssets,
      curatedAssets,
      transitionPosition,
      type,
      uniswapAssetsInWallet,
    } = this.props;

    if (type === null || type === undefined) {
      return null;
    }

    const { searchQuery, searchQueryForSearch, isSearching } = this.state;

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
          { threshold: matchSorter.rankings.WORD_STARTS_WITH }
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
              { threshold: matchSorter.rankings.WORD_STARTS_WITH }
            );
          }
        );

        filteredList = [];

        filteredBest.length &&
          filteredList.push({ data: filteredBest, title: '' });

        filteredHigh.length &&
          filteredList.push({
            data: filterScams(filteredBest, filteredHigh),
            title: filteredBest.length ? 'MORE RESULTS' : '',
          });

        filteredLow.length &&
          filteredList.push({
            data: filterScams(filteredBest, filteredLow),
            title: 'LOW LIQUIDITY',
          });
      } else {
        filteredList = headerlessSection(concat(favorites, curatedAssets));
      }
    }

    const isFocused = this.props.navigation.getParam('focused', false);
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
                isSearching={isSearching}
                type={type}
                query={searchQueryForSearch}
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
      curatedAssets,
      favorites,
      globalHighLiquidityAssets,
      globalLowLiquidityAssets,
      navigation,
      ...props
    }) => ({
      ...props,
      curatedAssets: normalizeAssetItems(curatedAssets),
      favorites: normalizeAssetItems(favorites),
      globalHighLiquidityAssets: normalizeAssetItems(globalHighLiquidityAssets),
      globalLowLiquidityAssets: normalizeAssetItems(globalLowLiquidityAssets),
      navigation,
      transitionPosition: get(navigation, 'state.params.position'),
      type: get(navigation, 'state.params.type', null),
    })
  )
)(CurrencySelectModal);
