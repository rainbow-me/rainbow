import { useIsFocused, useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { toLower, uniqBy } from 'lodash';
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
import { IS_TESTING } from 'react-native-dotenv';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { useTheme } from 'styled-components';
import { useDebounce } from 'use-debounce';
import GestureBlocker from '../components/GestureBlocker';
import {
  CurrencySelectionList,
  CurrencySelectModalHeader,
  ExchangeSearch,
} from '../components/exchange';
import NetworkSwitcher from '../components/exchange/NetworkSwitcher';
import { Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import { usePagerPosition } from '../navigation/ScrollPositionContext';
import { addHexPrefix } from '@rainbow-me/handlers/web3';
import { CurrencySelectionTypes } from '@rainbow-me/helpers';
import {
  useAssetsInWallet,
  useCoinListEditOptions,
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useSwapCurrencyList,
} from '@rainbow-me/hooks';
import { delayNext } from '@rainbow-me/hooks/useMagicAutofocus';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { emitChartsRequest } from '@rainbow-me/redux/explorer';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { ethereumUtils, filterList } from '@rainbow-me/utils';

const TabTransitionAnimation = styled(Animated.View)(
  position.sizeAsObject('100%')
);

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
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const {
    params: {
      onSelectCurrency,
      restoreFocusOnSwapModal,
      setPointerEvents,
      toggleGestureEnabled,
      type,
      chainId,
    },
  } = useRoute();

  const scrollPosition = usePagerPosition();

  const searchInputRef = useRef();
  const { handleFocus } = useMagicAutofocus(searchInputRef, undefined, true);

  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryForSearch] = useDebounce(searchQuery, 350);
  const searchQueryExists = useMemo(() => searchQuery.length > 0, [
    searchQuery,
  ]);
  const assetsInWallet = useAssetsInWallet();
  const { hiddenCoins } = useCoinListEditOptions();

  const [currentChainId, setCurrentChainId] = useState(chainId);
  useEffect(() => {
    if (chainId) {
      setCurrentChainId(chainId);
    }
  }, [chainId]);

  const filteredAssetsInWallet = useMemo(() => {
    if (type === CurrencySelectionTypes.input) {
      return assetsInWallet?.filter(asset => {
        return !hiddenCoins?.includes(asset.uniqueId);
      });
    }
    return [];
  }, [type, assetsInWallet, hiddenCoins]);

  const {
    swapCurrencyList,
    swapCurrencyListLoading,
    updateFavorites,
  } = useSwapCurrencyList(searchQueryForSearch, currentChainId);

  const getWalletCurrencyList = useCallback(() => {
    if (type === CurrencySelectionTypes.input) {
      if (searchQueryForSearch !== '') {
        const searchResults = searchWalletCurrencyList(
          filteredAssetsInWallet,
          searchQueryForSearch
        );
        return headerlessSection(searchResults);
      } else {
        return headerlessSection(filteredAssetsInWallet);
      }
    }
  }, [filteredAssetsInWallet, searchQueryForSearch, type]);

  const currencyList = useMemo(() => {
    let list =
      type === CurrencySelectionTypes.input
        ? getWalletCurrencyList()
        : swapCurrencyList;

    // Fake tokens with same symbols break detox e2e tests
    if (IS_TESTING === 'true' && type === CurrencySelectionTypes.output) {
      let symbols = [];
      list = list?.map(section => {
        // Remove dupes
        section.data = uniqBy(section?.data, 'symbol');
        // Remove dupes across sections
        section.data = section?.data?.filter(
          token => !symbols.includes(token?.symbol)
        );
        const sectionSymbols = section?.data?.map(token => token?.symbol);
        symbols = symbols.concat(sectionSymbols);

        return section;
      });
    }
    return list;
  }, [getWalletCurrencyList, type, swapCurrencyList]);

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
      dispatch(emitChartsRequest(item.mainnet_address || item.address));
      const isMainnet = currentChainId === 1;
      onSelectCurrency(
        isMainnet && type === CurrencySelectionTypes.output
          ? { ...item, type: 'token' }
          : item
      );
      setCurrentChainId(ethereumUtils.getChainIdFromType(item.type));
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
      dispatch,
      currentChainId,
      onSelectCurrency,
      type,
      searchQueryForSearch,
      dangerouslyGetState,
      navigate,
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

  const handleApplyFavoritesQueue = useCallback(() => {
    const addresses = Object.keys(assetsToFavoriteQueue);
    const [assetsToAdd, assetsToRemove] = addresses.reduce(
      ([add, remove], current) => {
        if (assetsToFavoriteQueue[current]) {
          add.push(current);
        } else {
          remove.push(current);
        }
        return [add, remove];
      },
      [[], []]
    );
    updateFavorites(assetsToAdd, true).then(() =>
      updateFavorites(assetsToRemove, false)
    );
  }, [assetsToFavoriteQueue, updateFavorites]);

  const [startInteraction] = useInteraction();
  useEffect(() => {
    // on new focus state
    if (isFocused !== prevIsFocused) {
      toggleGestureEnabled(!isFocused);
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

  const handleBackButton = useCallback(() => {
    setSearchQuery('');
    setCurrentChainId(chainId);
  }, [chainId]);

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
              handleBackButton={handleBackButton}
              testID="currency-select-header"
              type={type}
            />
            <ExchangeSearch
              isFetching={swapCurrencyListLoading}
              isSearching={swapCurrencyListLoading}
              onChangeText={setSearchQuery}
              onFocus={handleFocus}
              ref={searchInputRef}
              searchQuery={searchQuery}
              testID="currency-select-search"
            />
            {type === CurrencySelectionTypes.output && (
              <NetworkSwitcher
                colors={colors}
                currentChainId={currentChainId}
                setCurrentChainId={setCurrentChainId}
              />
            )}
            {type === null || type === undefined ? null : (
              <CurrencySelectionList
                itemProps={itemProps}
                listItems={currencyList}
                loading={swapCurrencyListLoading}
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
