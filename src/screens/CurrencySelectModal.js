import { concat, get, isEmpty, map } from 'lodash';
import matchSorter from 'match-sorter';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents } from 'react-navigation';
import { useIsFocused } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { compose, mapProps } from 'recompact';
import GestureBlocker from '../components/GestureBlocker';
import { interpolate } from '../components/animations';
import {
  CurrencySelectionList,
  CurrencySelectModalHeader,
  ExchangeSearch,
} from '../components/exchange';
import { Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import {
  usePrevious,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '../hooks';
import { position } from '../styles';
import { filterList, filterScams } from '../utils/search';
import {
  CurrencySelectionTypes,
  exchangeModalBorderRadius,
} from './ExchangeModal';

const headerlessSection = data => [{ data, title: '' }];

const CurrencySelectModal = ({
  headerTitle,
  navigation,
  restoreFocusOnSwapModal,
  transitionPosition,
  type,
}) => {
  const dispatch = useDispatch();
  const {
    curatedAssets,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    isInitialized,
    uniswapUpdateFavorites,
  } = useUniswapAssets();
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');

  const shouldUpdateFavoritesRef = useRef(false);
  const searchInputRef = useRef();
  const searchQueryDebounceHandle = useRef();

  useEffect(() => {
    if (searchQueryDebounceHandle && searchQueryDebounceHandle.current)
      clearTimeout(searchQueryDebounceHandle.current);
    searchQueryDebounceHandle.current = setTimeout(
      () => {
        setSearchQueryForSearch(searchQuery);
      },
      searchQuery === '' ? 1 : 250
    );
  }, [searchQuery]);

  const searchQueryExists = searchQuery.length > 0;

  useEffect(() => {
    if (!searchQueryExists && shouldUpdateFavoritesRef.current) {
      shouldUpdateFavoritesRef.current = false;

      Object.keys(assetsToFavoriteQueue).map(assetToFavorite =>
        dispatch(
          uniswapUpdateFavorites(
            assetToFavorite,
            assetsToFavoriteQueue[assetToFavorite]
          )
        )
      );
    } else if (searchQueryExists) {
      shouldUpdateFavoritesRef.current = true;
    }
  }, [
    assetsToFavoriteQueue,
    dispatch,
    searchQueryExists,
    uniswapUpdateFavorites,
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
      dispatch(
        uniswapUpdateFavorites(
          assetToFavorite,
          assetsToFavoriteQueue[assetToFavorite]
        )
      )
    );

    handleChangeSearchQuery('');
  }, [assetsToFavoriteQueue, dispatch, uniswapUpdateFavorites]);

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

  const isFocused = useIsFocused();
  const wasFocused = usePrevious(isFocused);

  useEffect(() => {
    if (!wasFocused && isFocused) {
      handleWillFocus();
    } else if (wasFocused && !isFocused) {
      handleWillBlur();
      InteractionManager.runAfterInteractions(() => {
        handleDidBlur();
        restoreFocusOnSwapModal();
      });
    }
  }, [
    handleDidBlur,
    handleWillBlur,
    handleWillFocus,
    isFocused,
    restoreFocusOnSwapModal,
    wasFocused,
  ]);

  if (type === null || type === undefined) {
    return null;
  }

  let filteredList = [];
  if (type === CurrencySelectionTypes.input) {
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
    const curatedSection = concat(favorites, curatedAssets);
    if (!isEmpty(searchQueryForSearch)) {
      const [filteredBest, filteredHigh, filteredLow] = map(
        [curatedSection, globalHighLiquidityAssets, globalLowLiquidityAssets],
        section =>
          filterList(section, searchQueryForSearch, ['symbol', 'name'], {
            threshold: matchSorter.rankings.CONTAINS,
          })
      );

      filteredList = [];
      filteredBest.length &&
        filteredList.push({ data: filteredBest, title: '' });

      const filteredHighWithoutScams = filterScams(filteredBest, filteredHigh);

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
              loading={loading}
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
  headerTitle: PropTypes.string,
  navigation: PropTypes.object,
  transitionPosition: PropTypes.object,
  type: PropTypes.oneOf(Object.keys(CurrencySelectionTypes)),
};

export default compose(
  mapProps(({ navigation, ...props }) => ({
    ...props,
    headerTitle: get(navigation, 'state.params.headerTitle', null),
    navigation,
    restoreFocusOnSwapModal: get(
      navigation,
      'state.params.restoreFocusOnSwapModal',
      null
    ),
    transitionPosition: get(navigation, 'state.params.position'),
    type: get(navigation, 'state.params.type', null),
  }))
)(CurrencySelectModal);
