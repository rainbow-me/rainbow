import { useIsFocused, useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { toLower } from 'lodash';
import { matchSorter } from 'match-sorter';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StatusBar } from 'react-native';
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
import { CurrencySelectionTypes } from '@rainbow-me/helpers';
import {
  useCoinListEditOptions,
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useUniswapAssetsInWallet,
  useUniswapCurrencyList,
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

const searchWalletCurrencyList = (searchList, query) => {
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
  const uniswapAssetsInWallet = useUniswapAssetsInWallet();
  const { hiddenCoins } = useCoinListEditOptions();

  const filteredUniswapAssetsInWallet = useMemo(
    () =>
      uniswapAssetsInWallet.filter(
        ({ uniqueId }) => !hiddenCoins.includes(uniqueId)
      ),
    [uniswapAssetsInWallet, hiddenCoins]
  );

  const {
    uniswapCurrencyList,
    uniswapCurrencyListLoading,
    updateFavorites,
  } = useUniswapCurrencyList(searchQueryForSearch);
  const getWalletCurrencyList = () => {
    if (searchQueryForSearch !== '') {
      const searchResults = searchWalletCurrencyList(
        filteredUniswapAssetsInWallet,
        searchQueryForSearch
      );
      return headerlessSection(searchResults);
    } else {
      return headerlessSection(filteredUniswapAssetsInWallet);
    }
  };
  const currencyList =
    type === CurrencySelectionTypes.input
      ? getWalletCurrencyList()
      : uniswapCurrencyList;

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
      setSearchQuery('');
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
            <CurrencySelectModalHeader
              setSearchQuery={setSearchQuery}
              testID="currency-select-header"
            />
            <ExchangeSearch
              isFetching={uniswapCurrencyListLoading}
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
                loading={uniswapCurrencyListLoading}
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
