import { ChainId } from '@rainbow-me/swaps';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { uniqBy } from 'lodash';
import { matchSorter } from 'match-sorter';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, Keyboard, Linking, StatusBar } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { MMKV } from 'react-native-mmkv';
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
import { STORAGE_IDS } from '../model/mmkv';
import { usePagerPosition } from '../navigation/ScrollPositionContext';
import { analytics } from '@/analytics';
import { addHexPrefix } from '@/handlers/web3';
import { CurrencySelectionTypes, Network } from '@/helpers';
import {
  useAssetsInWallet,
  useCoinListEditOptions,
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useSwapCurrencies,
  useSwapCurrencyList,
} from '@/hooks';
import { delayNext } from '@/hooks/useMagicAutofocus';
import { getActiveRoute, useNavigation } from '@/navigation/Navigation';
import { emitAssetRequest, emitChartsRequest } from '@/redux/explorer';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { ethereumUtils, filterList } from '@/utils';

const storage = new MMKV();
const getHasShownWarning = () =>
  storage.getBoolean(STORAGE_IDS.SHOWN_SWAP_RESET_WARNING);
const setHasShownWarning = () =>
  storage.set(STORAGE_IDS.SHOWN_SWAP_RESET_WARNING, true);

const TabTransitionAnimation = styled(Animated.View)(
  position.sizeAsObject('100%')
);

const headerlessSection = data => [{ data, title: '' }];
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

const searchWalletCurrencyList = (searchList, query) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);

  if (isAddress) {
    const formattedQuery = addHexPrefix(query).toLowerCase();
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
  const { goBack, navigate, dangerouslyGetState } = useNavigation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const {
    params: {
      defaultOutputAsset,
      defaultInputAsset,
      chainId,
      fromDiscover,
      onSelectCurrency,
      params,
      restoreFocusOnSwapModal,
      toggleGestureEnabled,
      type,
      callback,
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
  const { hiddenCoinsObj } = useCoinListEditOptions();

  const [currentChainId, setCurrentChainId] = useState(chainId);
  useEffect(() => {
    if (chainId && typeof chainId === 'number') {
      setCurrentChainId(chainId);
    }
  }, [chainId]);

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const filteredAssetsInWallet = useMemo(() => {
    if (type === CurrencySelectionTypes.input) {
      let filteredAssetsInWallet = assetsInWallet?.filter(
        asset => !hiddenCoinsObj[asset.uniqueId]
      );
      //TODO: remove this once BACK-219 is fixed
      if (fromDiscover && defaultOutputAsset?.implementations) {
        const outputTokenNetworks = Object.keys(
          defaultOutputAsset?.implementations
        );

        filteredAssetsInWallet = filteredAssetsInWallet.filter(asset => {
          const network = ethereumUtils.getNetworkFromType(asset.type);
          return outputTokenNetworks.includes(network);
        });
      }
      return filteredAssetsInWallet;
    }
    return [];
  }, [
    type,
    assetsInWallet,
    fromDiscover,
    defaultOutputAsset?.implementations,
    hiddenCoinsObj,
  ]);

  const {
    swapCurrencyList,
    swapCurrencyListLoading,
    updateFavorites,
  } = useSwapCurrencyList(searchQueryForSearch, currentChainId);

  const checkForSameNetwork = useCallback(
    (newAsset, selectAsset, type) => {
      const otherAsset = type === 'input' ? outputCurrency : inputCurrency;
      const hasShownWarning = getHasShownWarning();
      if (
        otherAsset &&
        newAsset?.type !== otherAsset?.type &&
        !hasShownWarning
      ) {
        Keyboard.dismiss();
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.EXPLAIN_SHEET, {
            network: newAsset?.type
              ? ethereumUtils.getNetworkFromType(newAsset?.type)
              : Network.mainnet,
            onClose: () => {
              setHasShownWarning();
              selectAsset();
            },
            type: 'swapResetInputs',
          });
        });

        return true;
      }
      return false;
    },
    [inputCurrency, navigate, outputCurrency]
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const routeName = getActiveRoute()?.name;
  const showList = useMemo(() => {
    const viewingExplainer = routeName === Routes.EXPLAIN_SHEET;
    return isFocused || viewingExplainer || isTransitioning;
  }, [isFocused, routeName, isTransitioning]);

  const linkToHop = useCallback(() => {
    Linking.openURL('https://app.hop.exchange/#/send');
  }, []);

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

    // Remove tokens that show up in two lists and empty sections
    let uniqueIds = [];
    list = list?.map(section => {
      // Remove dupes
      section.data = uniqBy(section?.data, 'uniqueId');
      // Remove dupes across sections
      section.data = section?.data?.filter(
        token => !uniqueIds.includes(token?.uniqueId)
      );
      const sectionUniqueIds = section?.data?.map(token => token?.uniqueId);
      uniqueIds = uniqueIds.concat(sectionUniqueIds);

      return section;
    });

    // ONLY FOR e2e!!! Fake tokens with same symbols break detox e2e tests
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
    return list.filter(section => section.data.length > 0);
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

  const handleNavigate = useCallback(
    item => {
      delayNext();
      dangerouslyGetState().index = 1;
      if (fromDiscover) {
        goBack();
        setTimeout(
          () => {
            navigate(Routes.EXCHANGE_MODAL, {
              params: {
                inputAsset:
                  type === CurrencySelectionTypes.output
                    ? defaultInputAsset
                    : item,
                outputAsset:
                  type === CurrencySelectionTypes.input
                    ? defaultOutputAsset
                    : item,
                ...params,
              },
              screen: Routes.MAIN_EXCHANGE_SCREEN,
            });
            setSearchQuery('');
            setCurrentChainId(ethereumUtils.getChainIdFromType(item.type));
          },
          android ? 500 : 0
        );
      } else {
        navigate(Routes.MAIN_EXCHANGE_SCREEN);
        setSearchQuery('');
        setCurrentChainId(ethereumUtils.getChainIdFromType(item.type));
      }
      if (searchQueryForSearch) {
        analytics.track('Selected a search result in Swap', {
          name: item.name,
          searchQueryForSearch,
          symbol: item.symbol,
          tokenAddress: item.address,
          type,
        });
      }
    },
    [
      dangerouslyGetState,
      defaultInputAsset,
      defaultOutputAsset,
      fromDiscover,
      goBack,
      navigate,
      params,
      searchQueryForSearch,
      type,
    ]
  );
  const checkForRequiredAssets = useCallback(
    item => {
      if (
        type === CurrencySelectionTypes.output &&
        currentChainId &&
        currentChainId !== ChainId.mainnet
      ) {
        const currentL2Name = ethereumUtils.getNetworkNameFromChainId(
          currentChainId
        );
        const currentL2WalletAssets = assetsInWallet.filter(
          ({ network }) =>
            network && network?.toLowerCase() === currentL2Name?.toLowerCase()
        );
        if (currentL2WalletAssets?.length < 1) {
          Keyboard.dismiss();
          InteractionManager.runAfterInteractions(() => {
            navigate(Routes.EXPLAIN_SHEET, {
              assetName: item?.symbol,
              network: ethereumUtils.getNetworkFromChainId(currentChainId),
              networkName: currentL2Name,
              onClose: linkToHop,
              type: 'obtainL2Assets',
            });
          });
          return true;
        }
        return false;
      }
    },
    [assetsInWallet, currentChainId, linkToHop, navigate, type]
  );

  const handleSelectAsset = useCallback(
    item => {
      if (checkForRequiredAssets(item)) return;

      const isMainnet = currentChainId === 1;
      const assetWithType =
        isMainnet && type === CurrencySelectionTypes.output
          ? { ...item, type: 'token' }
          : item;

      const selectAsset = () => {
        dispatch(emitChartsRequest(item.mainnet_address || item.address));
        dispatch(emitAssetRequest(item.mainnet_address || item.address));
        setIsTransitioning(true); // continue to display list during transition
        callback?.();
        onSelectCurrency(assetWithType, handleNavigate);
      };
      if (
        checkForSameNetwork(
          assetWithType,
          selectAsset,
          type === CurrencySelectionTypes.output
            ? CurrencySelectionTypes.output
            : CurrencySelectionTypes.input
        )
      )
        return;

      selectAsset();
    },
    [
      checkForRequiredAssets,
      checkForSameNetwork,
      dispatch,
      currentChainId,
      callback,
      onSelectCurrency,
      type,
      handleNavigate,
    ]
  );

  const itemProps = useMemo(() => {
    const isMainnet = currentChainId === ChainId.mainnet;
    return {
      onActionAsset: handleFavoriteAsset,
      onPress: handleSelectAsset,
      showBalance: type === CurrencySelectionTypes.input,
      showFavoriteButton: type === CurrencySelectionTypes.output && isMainnet,
    };
  }, [handleFavoriteAsset, handleSelectAsset, type, currentChainId]);

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
    if (!fromDiscover) {
      if (isFocused !== prevIsFocused) {
        toggleGestureEnabled(!isFocused);
      }
      if (!isFocused && prevIsFocused) {
        handleApplyFavoritesQueue();
        restoreFocusOnSwapModal?.();
        setTimeout(() => {
          setIsTransitioning(false); // hide list now that we have arrived on main exchange modal
        }, 750);
      }
    }
  }, [
    handleApplyFavoritesQueue,
    isFocused,
    startInteraction,
    prevIsFocused,
    restoreFocusOnSwapModal,
    toggleGestureEnabled,
    fromDiscover,
  ]);

  const isFocusedAndroid = useIsFocused() && android;

  const handleBackButton = useCallback(() => {
    setSearchQuery('');
    setCurrentChainId(chainId);
    setIsTransitioning(true); // continue to display list while transitiong back
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
    opacity: android ? 1 : scrollPosition.value,
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
          {isFocusedAndroid && <StatusBar barStyle="light-content" />}
          <GestureBlocker type="top" />
          <Column flex={1}>
            <CurrencySelectModalHeader
              handleBackButton={handleBackButton}
              showBackButton={!fromDiscover}
              showHandle={fromDiscover}
              testID="currency-select-header"
              type={type}
            />
            <ExchangeSearch
              clearTextOnFocus={false}
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
                testID="currency-select-network-switcher"
              />
            )}
            {type === null || type === undefined ? null : (
              <CurrencySelectionList
                footerSpacer={android}
                itemProps={itemProps}
                listItems={currencyList}
                loading={swapCurrencyListLoading}
                query={searchQueryForSearch}
                showList={showList}
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
