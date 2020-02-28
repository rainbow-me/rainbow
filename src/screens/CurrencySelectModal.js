import { concat, get, isEmpty, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, mapProps, shouldUpdate } from 'recompact';
import { withUniswapAssets } from '../hoc';
import { usePrevious } from '../hooks';
import { position } from '../styles';
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
import { isNewValueForObjectPaths } from '../utils';
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

const CurrencySelectModal = ({
  curatedAssets,
  favorites,
  globalHighLiquidityAssets,
  globalLowLiquidityAssets,
  headerTitle,
  navigation,
  transitionPosition,
  type,
  uniswapAssetsInWallet,
  uniswapGetAllExchanges,
  uniswapUpdateFavorites,
}) => {
  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');

  const searchInputRef = useRef();
  const debounceHandler = useRef();

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      uniswapGetAllExchanges();
    });
  }, [uniswapGetAllExchanges]);

  useEffect(() => {
    if (debounceHandler && debounceHandler.current)
      clearTimeout(debounceHandler.current);
    debounceHandler.current = setTimeout(() => {
      setSearchQueryForSearch(searchQuery);
    }, 250);
  }, [searchQuery]);

  const isFocused = navigation.getParam('focused', false);
  const wasFocused = usePrevious(isFocused);

  useEffect(() => {
    if (!wasFocused && isFocused) {
      handleWillFocus();
    } else if (wasFocused && !isFocused) {
      handleWillBlur();
      InteractionManager.runAfterInteractions(() => {
        handleDidBlur();
        navigation.state.params.restoreFocusOnSwapModal();
      });
    }
  }, [
    handleDidBlur,
    handleWillBlur,
    handleWillFocus,
    isFocused,
    navigation.state.params,
    wasFocused,
  ]);

  const dangerouslySetIsGestureBlocked = useCallback(
    isGestureBlocked => {
      // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
      navigation.dangerouslyGetParent().setParams({ isGestureBlocked });
    },
    [navigation]
  );

  const handleFavoriteAsset = (assetAddress, isFavorited) => {
    setAssetsToFavoriteQueue(prevFavoriteQueue => {
      const newFavoriteQueue = {
        ...prevFavoriteQueue,
        [assetAddress]: isFavorited,
      };
      return newFavoriteQueue;
    });
  };

  const handlePressBack = () => {
    navigation.navigate('MainExchangeScreen');
  };

  const handleSelectAsset = item => {
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(item)
    // but this small hack seems to be a legit workaround
    const onSelectCurrency = navigation.getParam('onSelectCurrency');
    onSelectCurrency(item);
    navigation.navigate('MainExchangeScreen');
  };

  const handleChangeSearchQuery = newSearchQuery =>
    setSearchQuery(newSearchQuery);

  const handleDidBlur = useCallback(() => {
    Object.keys(assetsToFavoriteQueue).map(assetToFavorite =>
      uniswapUpdateFavorites(
        assetToFavorite,
        assetsToFavoriteQueue[assetToFavorite]
      )
    );

    handleChangeSearchQuery('');
  }, [assetsToFavoriteQueue, uniswapUpdateFavorites]);

  const handleWillBlur = useCallback(
    () => dangerouslySetIsGestureBlocked(false),
    [dangerouslySetIsGestureBlocked]
  );

  const handleWillFocus = useCallback(() => {
    dangerouslySetIsGestureBlocked(true);
    if (searchInputRef && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dangerouslySetIsGestureBlocked, searchInputRef]);

  if (type === null || type === undefined) {
    return null;
  }

  let filteredList = [];
  if (type === CurrencySelectionTypes.input) {
    filteredList = headerlessSection(uniswapAssetsInWallet);
    if (!isEmpty(searchQueryForSearch)) {
      filteredList = filterList(uniswapAssetsInWallet, searchQueryForSearch, [
        'symbol',
        'name',
      ]);
      filteredList = headerlessSection(filteredList);
    }
  } else if (type === CurrencySelectionTypes.output) {
    const curatedSection = concat(favorites, curatedAssets);
    if (!isEmpty(searchQueryForSearch)) {
      const [filteredBest, filteredHigh, filteredLow] = map(
        [curatedSection, globalHighLiquidityAssets, globalLowLiquidityAssets],
        section => filterList(section, searchQueryForSearch, ['symbol', 'name'])
      );

      filteredList = [];
      filteredBest.length &&
        filteredList.push({ data: filteredBest, title: '' });

      filteredHigh.length &&
        filteredList.push({
          data: filteredHigh,
          title: filteredBest.length ? 'MORE RESULTS' : '',
        });

      filteredLow.length &&
        filteredList.push({ data: filteredLow, title: 'LOW LIQUIDITY' });
    } else {
      filteredList = headerlessSection(concat(favorites, curatedAssets));
    }
  }

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
            onDidBlur={handleDidBlur}
            onWillBlur={handleWillBlur}
            onWillFocus={handleWillFocus}
          />
          <Column flex={1}>
            <CurrencySelectModalHeader
              onPressBack={handlePressBack}
              title={headerTitle}
            />
            <ExchangeSearch
              autoFocus={false}
              onChangeText={handleChangeSearchQuery}
              ref={searchInputRef}
              searchQuery={searchQuery}
            />
            <CurrencySelectionList
              itemProps={{
                onFavoriteAsset: handleFavoriteAsset,
                onPress: handleSelectAsset,
                showBalance: type === CurrencySelectionTypes.input,
                showFavoriteButton: type === CurrencySelectionTypes.output,
              }}
              listItems={filteredList}
              showList={isFocused}
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

CurrencySelectModal.propTypes = {
  curatedAssets: PropTypes.array,
  favorites: PropTypes.array,
  globalHighLiquidityAssets: PropTypes.array,
  globalLowLiquidityAssets: PropTypes.array,
  headerTitle: PropTypes.string,
  navigation: PropTypes.object,
  transitionPosition: PropTypes.object,
  type: PropTypes.oneOf(Object.keys(CurrencySelectionTypes)),
  uniswapAssetsInWallet: PropTypes.arrayOf(PropTypes.object),
  uniswapGetAllExchanges: PropTypes.func,
  uniswapUpdateFavorites: PropTypes.func,
};

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
  ),
  shouldUpdate((props, nextProps) => {
    const isFocused = props.navigation.getParam('focused', false);
    const willBeFocused = nextProps.navigation.getParam('focused', false);

    const isNewType = props.type !== nextProps.type;

    const isNewProps = isNewValueForObjectPaths(
      { ...props, isFocused },
      { ...nextProps, isFocused: willBeFocused },
      ['isFocused', 'type']
    );

    return isNewType || isNewProps;
  })
)(CurrencySelectModal);
