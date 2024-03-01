import lang from 'i18n-js';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { uniqBy } from 'lodash';
import { matchSorter } from 'match-sorter';
import React, { Fragment, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DefaultSectionT, InteractionManager, Keyboard, Linking, SectionList, TextInput } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import GestureBlocker from '../components/GestureBlocker';
import { CurrencySelectionList, CurrencySelectModalHeader, ExchangeSearch } from '../components/exchange';
import NetworkSwitcherv1 from '../components/exchange/NetworkSwitcher';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import { STORAGE_IDS } from '../model/mmkv';
import { analytics } from '@/analytics';
import { addHexPrefix, isL2Network } from '@/handlers/web3';
import { CurrencySelectionTypes, Network, TokenSectionTypes } from '@/helpers';
import {
  useAccountSettings,
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useSwapCurrencies,
  useSwapCurrencyList,
  useSwappableUserAssets,
} from '@/hooks';
import { delayNext } from '@/hooks/useMagicAutofocus';
import { getActiveRoute, useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, filterList } from '@/utils';
import NetworkSwitcherv2 from '@/components/exchange/NetworkSwitcherv2';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { SwappableAsset } from '@/entities';
import { Box, Row, Rows } from '@/design-system';
import { useTheme } from '@/theme';
import { IS_TEST } from '@/env';
import { useSortedUserAssets } from '@/resources/assets/useSortedUserAssets';
import DiscoverSearchInput from '@/components/discover/DiscoverSearchInput';
import { externalTokenQueryKey, fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { getNetworkObj } from '@/networks';
import { queryClient } from '@/react-query/queryClient';

export interface EnrichedExchangeAsset extends SwappableAsset {
  ens: boolean;
  color: string;
  nickname: string;
  onPress: (el: ReactElement) => void;
  testID: string;
  useGradientText: boolean;
  title?: string;
  key: string;
  disabled?: boolean;
}

const storage = new MMKV();
const getHasShownWarning = () => storage.getBoolean(STORAGE_IDS.SHOWN_SWAP_RESET_WARNING);
const setHasShownWarning = () => storage.set(STORAGE_IDS.SHOWN_SWAP_RESET_WARNING, true);

const headerlessSection = (data: SwappableAsset[]): { data: SwappableAsset[]; title: string; key: string }[] => [
  { data, title: '', key: 'swappableAssets' },
];
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

const searchWalletCurrencyList = (searchList: SwappableAsset[], query: string) => {
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

type ParamList = {
  Currency: {
    defaultOutputAsset: SwappableAsset;
    defaultInputAsset: SwappableAsset;
    chainId: number;
    fromDiscover: boolean;
    onSelectCurrency: (asset: SwappableAsset, cb: (item: any) => void) => void;
    params: Record<string, unknown>;
    restoreFocusOnSwapModal: () => void;
    toggleGestureEnabled: (arg: boolean) => void;
    type: string;
    callback: () => void;
  };
};

export default function CurrencySelectModal() {
  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const { goBack, navigate, getState: dangerouslyGetState } = useNavigation();
  const { nativeCurrency } = useAccountSettings();
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
  } = useRoute<RouteProp<ParamList, 'Currency'>>();

  const listRef = useRef<SectionList<any, DefaultSectionT>>(null);

  const searchInputRef = useRef<TextInput>(null);
  const { handleFocus } = useMagicAutofocus(searchInputRef, undefined, true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryForSearch] = useDebounce(searchQuery, 350);
  const { data: sortedAssets } = useSortedUserAssets();
  const assetsInWallet = sortedAssets as SwappableAsset[];

  const [currentChainId, setCurrentChainId] = useState(chainId);
  const prevChainId = usePrevious(currentChainId);

  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);
  const NetworkSwitcher = crosschainSwapsEnabled ? NetworkSwitcherv2 : NetworkSwitcherv1;
  const SearchInput = crosschainSwapsEnabled ? DiscoverSearchInput : ExchangeSearch;

  useEffect(() => {
    if (chainId && typeof chainId === 'number') {
      setCurrentChainId(chainId);
    }
  }, [chainId]);

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const { crosschainExactMatches, swapCurrencyList, swapCurrencyListLoading } = useSwapCurrencyList(
    searchQueryForSearch,
    currentChainId,
    false
  );

  const { swappableUserAssets, unswappableUserAssets } = useSwappableUserAssets({ outputCurrency });

  const checkForSameNetwork = useCallback(
    (newAsset: any, selectAsset: any, type: any) => {
      const otherAsset = type === 'input' ? outputCurrency : inputCurrency;
      const hasShownWarning = getHasShownWarning();
      if (
        otherAsset &&
        ethereumUtils.getChainIdFromNetwork(newAsset?.network) !== ethereumUtils.getChainIdFromNetwork(otherAsset?.network) &&
        !hasShownWarning
      ) {
        Keyboard.dismiss();
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.EXPLAIN_SHEET, {
            network: newAsset?.network,
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
    let walletCurrencyList;
    if (type === CurrencySelectionTypes.input) {
      if (searchQueryForSearch !== '') {
        const searchResults = searchWalletCurrencyList(swappableUserAssets, searchQueryForSearch);
        walletCurrencyList = headerlessSection(searchResults);
        if (crosschainSwapsEnabled) {
          const unswappableSearchResults = searchWalletCurrencyList(unswappableUserAssets, searchQueryForSearch);
          walletCurrencyList.push({
            data: unswappableSearchResults.map(unswappableAsset => ({
              ...unswappableAsset,
              disabled: true,
            })),
            title: lang.t(`exchange.token_sections.${TokenSectionTypes.unswappableTokenSection}`),
            key: 'unswappableAssets',
          });
        }
        return walletCurrencyList;
      } else {
        walletCurrencyList = headerlessSection(swappableUserAssets);
        let unswappableAssets = unswappableUserAssets;
        if (IS_TEST) {
          unswappableAssets = unswappableAssets.concat({
            address: '0x123',
            decimals: 18,
            name: 'Unswappable',
            symbol: 'UNSWAP',
            network: Network.mainnet,
            id: 'foobar',
            uniqueId: '0x123',
          });
        }
        if (crosschainSwapsEnabled) {
          walletCurrencyList.push({
            data: unswappableAssets.map(unswappableAsset => ({
              ...unswappableAsset,
              disabled: true,
            })),
            title: lang.t(`exchange.token_sections.${TokenSectionTypes.unswappableTokenSection}`),
            key: 'unswappableAssets',
          });
        }
        return walletCurrencyList;
      }
    }
  }, [searchQueryForSearch, type, crosschainSwapsEnabled, swappableUserAssets, unswappableUserAssets]);

  const activeSwapCurrencyList = useMemo(() => {
    if (crosschainExactMatches.length) {
      return crosschainExactMatches;
    }
    return swapCurrencyList;
  }, [crosschainExactMatches, swapCurrencyList]);

  const currencyList = useMemo(() => {
    let list = (type === CurrencySelectionTypes.input ? getWalletCurrencyList() : activeSwapCurrencyList) as {
      data: EnrichedExchangeAsset[];
      title: string;
    }[];

    // Remove tokens that show up in two lists and empty sections
    let uniqueIds: string[] = [];
    list = list?.map(section => {
      // Remove dupes
      section.data = uniqBy(section?.data, 'uniqueId');
      // Remove dupes across sections
      section.data = section?.data?.filter(token => !uniqueIds.includes(token?.uniqueId));
      const sectionUniqueIds = section?.data?.map(token => token?.uniqueId);
      uniqueIds = uniqueIds.concat(sectionUniqueIds);

      return section;
    });

    // ONLY FOR e2e!!! Fake tokens with same symbols break detox e2e tests
    if (IS_TEST && type === CurrencySelectionTypes.output) {
      let symbols: string[] = [];
      list = list?.map(section => {
        // Remove dupes
        section.data = uniqBy(section?.data, 'symbol');
        // Remove dupes across sections
        section.data = section?.data?.filter(token => !symbols.includes(token?.symbol));
        const sectionSymbols = section?.data?.map(token => token?.symbol);
        symbols = symbols.concat(sectionSymbols);

        return section;
      });
    }
    return list.filter(section => section.data.length > 0);
  }, [activeSwapCurrencyList, getWalletCurrencyList, type]);

  const handleNavigate = useCallback(
    (item: any) => {
      delayNext();
      // @ts-expect-error read only property
      dangerouslyGetState().index = 1;
      if (fromDiscover) {
        goBack();
        setTimeout(
          () => {
            navigate(Routes.EXCHANGE_MODAL, {
              params: {
                inputAsset: type === CurrencySelectionTypes.output ? defaultInputAsset : item,
                outputAsset: type === CurrencySelectionTypes.input ? defaultOutputAsset : item,
                ...params,
              },
              screen: Routes.MAIN_EXCHANGE_SCREEN,
            });
            setSearchQuery('');
            setCurrentChainId(ethereumUtils.getChainIdFromNetwork(item.network));
          },
          android ? 500 : 0
        );
      } else {
        navigate(Routes.MAIN_EXCHANGE_SCREEN);
        setSearchQuery('');
        setCurrentChainId(ethereumUtils.getChainIdFromNetwork(item.network));
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
    [dangerouslyGetState, defaultInputAsset, defaultOutputAsset, fromDiscover, goBack, navigate, params, searchQueryForSearch, type]
  );
  const checkForRequiredAssets = useCallback(
    (item: any) => {
      if (type === CurrencySelectionTypes.output && currentChainId && currentChainId !== getNetworkObj(Network.mainnet).id) {
        const currentL2Name = ethereumUtils.getNetworkNameFromChainId(currentChainId);
        const currentL2WalletAssets = assetsInWallet.filter(
          ({ network }) => network && network?.toLowerCase() === currentL2Name?.toLowerCase()
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
    (item: any) => {
      if (!crosschainSwapsEnabled && checkForRequiredAssets(item)) return;

      let newAsset = item;

      const selectAsset = async () => {
        if (!item?.balance) {
          const network = getNetworkFromChainId(currentChainId);

          const externalAsset = await queryClient.fetchQuery(
            externalTokenQueryKey({
              address: item.address,
              network,
              currency: nativeCurrency,
            }),
            async () =>
              fetchExternalToken({
                address: item.address,
                network,
                currency: nativeCurrency,
              }),
            {
              staleTime: Infinity,
            }
          );
          // if the asset is external we need to add the network specific information
          newAsset = {
            ...newAsset,
            decimals: item?.networks?.[currentChainId]?.decimals || item.decimals,
            address: item?.address || item?.networks?.[currentChainId]?.address,
            network: getNetworkFromChainId(currentChainId),
            ...externalAsset,
          };
        }
        setIsTransitioning(true); // continue to display list during transition
        callback?.();
        onSelectCurrency(newAsset, handleNavigate);
      };
      if (
        !crosschainSwapsEnabled &&
        checkForSameNetwork(
          newAsset,
          selectAsset,
          type === CurrencySelectionTypes.output ? CurrencySelectionTypes.output : CurrencySelectionTypes.input
        )
      )
        return;

      selectAsset();
    },
    [
      crosschainSwapsEnabled,
      checkForRequiredAssets,
      currentChainId,
      type,
      checkForSameNetwork,
      nativeCurrency,
      callback,
      onSelectCurrency,
      handleNavigate,
    ]
  );

  const itemProps = useMemo(() => {
    const isMainnet = currentChainId === getNetworkObj(Network.mainnet).id;
    return {
      onPress: handleSelectAsset,
      showBalance: type === CurrencySelectionTypes.input,
      showFavoriteButton: type === CurrencySelectionTypes.output && isMainnet,
    };
  }, [handleSelectAsset, type, currentChainId]);

  const searchingOnL2Network = useMemo(() => isL2Network(ethereumUtils.getNetworkFromChainId(currentChainId)), [currentChainId]);

  const [startInteraction] = useInteraction();
  useEffect(() => {
    if (!fromDiscover) {
      if (isFocused !== prevIsFocused) {
        toggleGestureEnabled(!isFocused);
      }
      if (!isFocused && prevIsFocused) {
        restoreFocusOnSwapModal?.();
        setTimeout(() => {
          setIsTransitioning(false); // hide list now that we have arrived on main exchange modal
        }, 750);
      }
    }
  }, [isFocused, startInteraction, prevIsFocused, restoreFocusOnSwapModal, toggleGestureEnabled, fromDiscover]);

  const handleBackButton = useCallback(() => {
    setSearchQuery('');
    InteractionManager.runAfterInteractions(() => {
      const inputChainId = ethereumUtils.getChainIdFromNetwork(inputCurrency?.network);
      setCurrentChainId(inputChainId);
    });
    setIsTransitioning(true); // continue to display list while transitiong back
  }, [inputCurrency?.network]);

  useEffect(() => {
    // check if list has items before attempting to scroll
    if (!currencyList[0]?.data) return;
    if (currentChainId !== prevChainId) {
      listRef?.current?.scrollToLocation({
        animated: false,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 0,
        viewPosition: 0,
      });
    }
  }, [currencyList, currentChainId, prevChainId]);

  return (
    <Wrapper>
      <Box as={Animated.View} height="full" width="full">
        {/* @ts-expect-error JavaScript component */}
        <Modal containerPadding={0} fullScreenOnAndroid height="100%" overflow="hidden" radius={30}>
          <GestureBlocker type="top" />
          <Rows>
            <Row height="content">
              <CurrencySelectModalHeader
                handleBackButton={handleBackButton}
                showBackButton={!fromDiscover}
                showHandle={fromDiscover}
                testID="currency-select-header"
              />
            </Row>
            <Row height="content">
              <SearchInput
                isDiscover={false}
                currentChainId={currentChainId}
                clearTextOnFocus={false}
                isFetching={swapCurrencyListLoading}
                isSearching={swapCurrencyListLoading}
                onChangeText={setSearchQuery}
                onFocus={handleFocus}
                ref={searchInputRef}
                searchQuery={searchQuery}
                testID="currency-select-search"
              />
            </Row>
            {type === CurrencySelectionTypes.output && (
              <Row height="content">
                {/* @ts-expect-error JavaScript component */}
                <NetworkSwitcher
                  colors={colors}
                  currentChainId={currentChainId}
                  setCurrentChainId={setCurrentChainId}
                  testID="currency-select-network-switcher"
                />
              </Row>
            )}
            {type === null || type === undefined ? null : (
              <CurrencySelectionList
                ref={listRef}
                isExchangeList={crosschainSwapsEnabled}
                onL2={searchingOnL2Network}
                footerSpacer={android}
                itemProps={itemProps}
                listItems={currencyList}
                loading={swapCurrencyListLoading}
                query={searchQueryForSearch}
                showList={showList}
                testID="currency-select-list"
              />
            )}
          </Rows>
          <GestureBlocker type="bottom" />
        </Modal>
      </Box>
    </Wrapper>
  );
}
