import { useIsFocused, useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { concat, map } from 'lodash';
import matchSorter from 'match-sorter';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StatusBar } from 'react-native';
import Animated, { Extrapolate } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
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
import { delayNext } from '../hooks/useMagicAutofocus';
import { useNavigation } from '../navigation/Navigation';
import {
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { filterList, filterScams } from '@rainbow-me/utils';

const TabTransitionAnimation = styled(Animated.View)`
  ${position.size('100%')};
`;

const headerlessSection = data => [{ data, title: '' }];
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

export default function CurrencySelectModal() {
  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const { navigate, dangerouslyGetState } = useNavigation();
  const {
    params: {
      category,
      onSelectCurrency,
      restoreFocusOnSwapModal,
      setPointerEvents,
      tabTransitionPosition,
      toggleGestureEnabled,
      type,
    },
  } = useRoute();

  const searchInputRef = useRef();
  const { handleFocus } = useMagicAutofocus(searchInputRef, undefined, true);

  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const searchQueryExists = useMemo(() => searchQuery.length > 0, [
    searchQuery,
  ]);

  const {
    curatedAssets,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    loadingAllTokens,
    updateFavorites,
  } = useUniswapAssets();
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();

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
          filteredList.push({
            data: filteredBest,
            title: '􀇻 Rainbow Verified',
            useGradientText: true,
          });

        const filteredHighWithoutScams = filterScams(
          filteredBest,
          filteredHigh
        );

        filteredHighWithoutScams.length &&
          filteredList.push({
            data: filteredHighWithoutScams,
            title: '􀇿 Unverified',
          });

        const filteredLowWithoutScams = filterScams(filteredBest, filteredLow);

        filteredLowWithoutScams.length &&
          filteredList.push({
            data: filteredLowWithoutScams,
            title: '􀇿 Low Liquidity',
          });
      } else {
        filteredList = [
          {
            data: concat(favorites, curatedAssets),
            title: '􀇻 Rainbow Verified',
            useGradientText: true,
          },
        ];
      }
    }
    setIsSearching(false);
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

  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  useEffect(() => {
    stopQueryDebounce();
    startQueryDebounce(
      () => {
        setIsSearching(true);
        setSearchQueryForSearch(searchQuery);
      },
      searchQuery === '' ? 1 : 250
    );
  }, [searchQuery, startQueryDebounce, stopQueryDebounce]);

  const handleFavoriteAsset = useCallback(
    (asset, isFavorited) => {
      setAssetsToFavoriteQueue(prevFavoriteQueue => ({
        ...prevFavoriteQueue,
        [asset.address]: isFavorited,
      }));
      analytics.track('Toggled an asset as Favorited', {
        category,
        isFavorited,
        name: asset.name,
        symbol: asset.symbol,
        tokenAddress: asset.address,
        type,
      });
    },
    [category, type]
  );

  const handleSelectAsset = useCallback(
    item => {
      setPointerEvents(false);
      onSelectCurrency(item);
      if (searchQueryForSearch) {
        analytics.track('Selected a search result in Swap', {
          category,
          name: item.name,
          searchQueryForSearch,
          symbol: item.symbol,
          tokenAddress: item.address,
          type,
        });
      }
      delayNext();
      dangerouslyGetState().index = 1;
      navigate(Routes.MAIN_EXCHANGE_SCREEN);
    },
    [
      setPointerEvents,
      onSelectCurrency,
      searchQueryForSearch,
      dangerouslyGetState,
      navigate,
      category,
      type,
    ]
  );

  const itemProps = useMemo(
    () => ({
      onFavoriteAsset: handleFavoriteAsset,
      onPress: handleSelectAsset,
      showBalance: type === CurrencySelectionTypes.input,
      showFavoriteButton: type === CurrencySelectionTypes.output,
    }),
    [handleFavoriteAsset, handleSelectAsset, type]
  );

  const handleApplyFavoritesQueue = useCallback(
    () =>
      Object.keys(assetsToFavoriteQueue).map(assetToFavorite =>
        updateFavorites(assetToFavorite, assetsToFavoriteQueue[assetToFavorite])
      ),
    [assetsToFavoriteQueue, updateFavorites]
  );

  const [startInteraction] = useInteraction();
  useEffect(() => {
    // on new focus state
    if (isFocused !== prevIsFocused) {
      android && toggleGestureEnabled(!isFocused);
      startInteraction(() => {
        ios && toggleGestureEnabled(!isFocused);
      });
    }

    // on page blur
    if (!isFocused && prevIsFocused) {
      handleApplyFavoritesQueue();
      setSearchQuery('');
      restoreFocusOnSwapModal?.();
    }
  }, [
    handleApplyFavoritesQueue,
    isFocused,
    startInteraction,
    prevIsFocused,
    restoreFocusOnSwapModal,
    toggleGestureEnabled,
  ]);

  const isFocusedAndroid = useIsFocused() && android;

  const shouldUpdateFavoritesRef = useRef(false);
  useEffect(() => {
    if (!searchQueryExists && shouldUpdateFavoritesRef.current) {
      shouldUpdateFavoritesRef.current = false;
      handleApplyFavoritesQueue();
    } else if (searchQueryExists) {
      shouldUpdateFavoritesRef.current = true;
    }
  }, [assetsToFavoriteQueue, handleApplyFavoritesQueue, searchQueryExists]);

  return (
    <Wrapper>
      <TabTransitionAnimation
        style={{
          opacity: android
            ? 1
            : interpolate(tabTransitionPosition, {
                extrapolate: Extrapolate.CLAMP,
                inputRange: [0, 1, 1],
                outputRange: [0, 1, 1],
              }),
          transform: [
            {
              translateX: android
                ? 0
                : interpolate(tabTransitionPosition, {
                    extrapolate: Animated.Extrapolate.CLAMP,
                    inputRange: [0, 1, 1],
                    outputRange: [8, 0, 0],
                  }),
            },
          ],
        }}
      >
        <Modal
          containerPadding={0}
          fullScreenOnAndroid
          height="100%"
          overflow="hidden"
          radius={30}
        >
          {isFocusedAndroid && <StatusBar barStyle="dark-content" />}
          <GestureBlocker type="top" />
          <Column flex={1}>
            <CurrencySelectModalHeader testID="currency-select-header" />
            <ExchangeSearch
              isFetching={loadingAllTokens}
              isSearching={isSearching}
              onChangeText={setSearchQuery}
              onFocus={handleFocus}
              ref={searchInputRef}
              searchQuery={searchQuery}
              testID="currency-select-search"
            />
            {type === null || type === undefined ? null : (
              <CurrencySelectionList
                itemProps={itemProps}
                listItems={currencyList}
                loading={loadingAllTokens}
                query={searchQueryForSearch}
                showList={isFocused}
                testID="currency-select-list"
                type={type}
              />
            )}
          </Column>
          <GestureBlocker type="bottom" />
        </Modal>
      </TabTransitionAnimation>
    </Wrapper>
  );
}
