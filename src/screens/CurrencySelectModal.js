import {
  useFocusEffect,
  useIsFocused,
  useRoute,
} from '@react-navigation/native';
import { concat, map } from 'lodash';
import matchSorter from 'match-sorter';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import GestureBlocker from '../components/GestureBlocker';
import { interpolate } from '../components/animations';
import {
  CurrencySelectionList,
  CurrencySelectModalHeader,
  ExchangeSearch,
} from '../components/exchange';
import { Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import CurrencySelectionTypes from '../helpers/currencySelectionTypes';
import {
  useTimeout,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { filterList, filterScams } from '../utils/search';
import { exchangeModalBorderRadius } from './ExchangeModal';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';

const headerlessSection = data => [{ data, title: '' }];

export default function CurrencySelectModal() {
  const isFocused = useIsFocused();
  const { params } = useRoute();
  const onSelectCurrency = params?.onSelectCurrency;
  const restoreFocusOnSwapModal = params?.restoreFocusOnSwapModal;
  const transitionPosition = params.position;

  useEffect(() => {
    if (isFocused) {
      transitionPosition.setValue(1);
    }
  }, [isFocused, transitionPosition]);
  const searchInputRef = useRef();
  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const searchQueryExists = useMemo(() => searchQuery.length > 0, [
    searchQuery,
  ]);

  const { navigate } = useNavigation();
  const type = params?.type;

  const {
    curatedAssets,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    isInitialized,
    updateFavorites,
  } = useUniswapAssets();
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();

  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  useEffect(() => {
    stopQueryDebounce();
    startQueryDebounce(
      () => setSearchQueryForSearch(searchQuery),
      searchQuery === '' ? 1 : 250
    );
  }, [searchQuery, startQueryDebounce, stopQueryDebounce]);

  const handleApplyFavoritesQueue = useCallback(
    () =>
      Object.keys(assetsToFavoriteQueue).map(assetToFavorite =>
        updateFavorites(assetToFavorite, assetsToFavoriteQueue[assetToFavorite])
      ),
    [assetsToFavoriteQueue, updateFavorites]
  );

  const shouldUpdateFavoritesRef = useRef(false);
  useEffect(() => {
    if (!searchQueryExists && shouldUpdateFavoritesRef.current) {
      shouldUpdateFavoritesRef.current = false;
      handleApplyFavoritesQueue();
    } else if (searchQueryExists) {
      shouldUpdateFavoritesRef.current = true;
    }
  }, [assetsToFavoriteQueue, handleApplyFavoritesQueue, searchQueryExists]);

  const handleFavoriteAsset = useCallback(
    (assetAddress, isFavorited) =>
      setAssetsToFavoriteQueue(prevFavoriteQueue => ({
        ...prevFavoriteQueue,
        [assetAddress]: isFavorited,
      })),
    []
  );

  const handleSelectAsset = useCallback(
    item => {
      onSelectCurrency(item);
      navigate(Routes.MAIN_EXCHANGE_SCREEN);
    },
    [onSelectCurrency, navigate]
  );

  useFocusEffect(() => {
    params?.toggleGestureEnabled(false);
    return () => {
      params?.toggleGestureEnabled(true);
      InteractionManager.runAfterInteractions(() => {
        handleApplyFavoritesQueue();
        setSearchQuery('');
        restoreFocusOnSwapModal();
      });
    };
  });

  const itemProps = useMemo(
    () => ({
      onFavoriteAsset: handleFavoriteAsset,
      onPress: handleSelectAsset,
      showBalance: type === CurrencySelectionTypes.input,
      showFavoriteButton: type === CurrencySelectionTypes.output,
    }),
    [handleFavoriteAsset, handleSelectAsset, type]
  );

  const currencyList = useMemo(() => {
    let filteredList = [];
    if (type === CurrencySelectionTypes.input) {
      filteredList = headerlessSection(uniswapAssetsInWallet);
      if (searchQueryForSearch) {
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
      if (searchQueryForSearch) {
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

    return filteredList;
  }, [
    curatedAssets,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    searchQueryForSearch,
    type,
    uniswapAssetsInWallet,
  ]);

  return (
    <KeyboardFixedOpenLayout>
      <Animated.View
        style={[
          position.sizeAsObject('100%'),
          {
            opacity: interpolate(transitionPosition, {
              extrapolate: Animated.Extrapolate.CLAMP,
              inputRange: [0, 0.8, 1],
              outputRange: [0, 1, 1],
            }),
          },
        ]}
      >
        <Modal
          containerPadding={0}
          height="100%"
          overflow="hidden"
          radius={exchangeModalBorderRadius}
        >
          <GestureBlocker type="top" />
          <Column flex={1}>
            <CurrencySelectModalHeader />
            <ExchangeSearch
              autoFocus={false}
              onChangeText={setSearchQuery}
              ref={searchInputRef}
              searchQuery={searchQuery}
            />
            {type === null || type === undefined ? null : (
              <CurrencySelectionList
                itemProps={itemProps}
                listItems={currencyList}
                loading={!isInitialized}
                query={searchQueryForSearch}
                showList={isFocused}
                type={type}
              />
            )}
          </Column>
          <GestureBlocker type="bottom" />
        </Modal>
      </Animated.View>
    </KeyboardFixedOpenLayout>
  );
}
