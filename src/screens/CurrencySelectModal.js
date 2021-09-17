import { useIsFocused, useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { map, toLower } from 'lodash';
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
import { IS_TESTING } from 'react-native-dotenv';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styled from 'styled-components';
import GestureBlocker from '../components/GestureBlocker';
import {
  CurrencySelectionList,
  CurrencySelectModalHeader,
  ExchangeSearch,
} from '../components/exchange';
import { Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import { usePagerPosition } from '../navigation/ScrollPositionContext';
import { addHexPrefix } from '@rainbow-me/handlers/web3';
import { CurrencySelectionTypes, TokenSectionTypes } from '@rainbow-me/helpers';
import {
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { delayNext } from '@rainbow-me/hooks/useMagicAutofocus';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { filterList } from '@rainbow-me/utils';

const TabTransitionAnimation = styled(Animated.View)`
  ${position.size('100%')};
`;

const headerlessSection = data => [{ data, title: '' }];
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

const searchCurrencyList = (searchList, query) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);

  if (isAddress) {
    const formattedQuery = toLower(addHexPrefix(query));
    return filterList(searchList, formattedQuery, ['address'], {
      threshold: matchSorter.rankings.CASE_SENSITIVE_EQUAL,
    });
  }

  return filterList(searchList, query, ['symbol', 'name'], {
    threshold: matchSorter.rankings.CONTAINS,
  });
};

export default function CurrencySelectModal() {
  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const { navigate, dangerouslyGetState } = useNavigation();
  const {
    params: {
      onSelectCurrency,
      restoreFocusOnSwapModal,
      setPointerEvents,
      toggleGestureEnabled,
      type,
    },
  } = useRoute();

  const scrollPosition = usePagerPosition();

  const searchInputRef = useRef();
  const { handleFocus } = useMagicAutofocus(searchInputRef, undefined, true);

  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const searchQueryExists = useMemo(() => searchQuery.length > 0, [
    searchQuery,
  ]);

  const { colors } = useTheme();
  const {
    curatedNotFavorited,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedAssets,
    loadingAllTokens,
    updateFavorites,
  } = useUniswapAssets();
  const uniswapAssetsInWallet = useUniswapAssetsInWallet();

  const currencyList = useMemo(() => {
    let filteredList = [];
    if (type === CurrencySelectionTypes.input) {
      filteredList = headerlessSection(uniswapAssetsInWallet);
      if (searchQueryForSearch) {
        filteredList = searchCurrencyList(
          uniswapAssetsInWallet,
          searchQueryForSearch
        );
        filteredList = headerlessSection(filteredList);
      }
    } else if (type === CurrencySelectionTypes.output) {
      if (searchQueryForSearch) {
        const [
          filteredFavorite,
          filteredVerified,
          filteredHighUnverified,
          filteredLow,
        ] = map(
          [
            favorites,
            globalVerifiedAssets,
            globalHighLiquidityAssets,
            globalLowLiquidityAssets,
          ],
          section => searchCurrencyList(section, searchQueryForSearch)
        );

        filteredList = [];
        filteredFavorite.length &&
          filteredList.push({
            color: colors.yellowFavorite,
            data: filteredFavorite,
            title: TokenSectionTypes.favoriteTokenSection,
          });

        filteredVerified.length &&
          filteredList.push({
            data: filteredVerified,
            title: TokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          });

        filteredHighUnverified.length &&
          filteredList.push({
            data: filteredHighUnverified,
            title: TokenSectionTypes.unverifiedTokenSection,
          });

        filteredLow.length &&
          filteredList.push({
            data: filteredLow,
            title: TokenSectionTypes.lowLiquidityTokenSection,
          });
      } else {
        filteredList = [
          {
            color: colors.yellowFavorite,
            data: favorites,
            title: TokenSectionTypes.favoriteTokenSection,
          },
          {
            data: curatedNotFavorited,
            title: TokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          },
        ];
      }
    }
    setIsSearching(false);
    return filteredList;
  }, [
    colors,
    curatedNotFavorited,
    favorites,
    globalVerifiedAssets,
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
        isFavorited,
        name: asset.name,
        symbol: asset.symbol,
        tokenAddress: asset.address,
        type,
      });
    },
    [type]
  );

  const handleSelectAsset = useCallback(
    item => {
      setPointerEvents(false);
      onSelectCurrency(item);
      if (searchQueryForSearch) {
        analytics.track('Selected a search result in Swap', {
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
      type,
    ]
  );

  const itemProps = useMemo(
    () => ({
      onActionAsset: handleFavoriteAsset,
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

  const style = useAnimatedStyle(() => ({
    opacity: scrollPosition.value,
    transform: [
      { scale: 0.9 + scrollPosition.value / 10 },
      { translateX: (1 - scrollPosition.value) * 8 },
    ],
  }));

  return (
    <Wrapper>
      <TabTransitionAnimation style={style}>
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
