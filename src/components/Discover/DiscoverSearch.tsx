import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import * as lang from '@/languages';
import deviceUtils from '@/utils/deviceUtils';
import CurrencySelectionList from '@/components/CurrencySelectionList';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { useSearchCurrencyList, usePrevious, useHardwareBackOnFocus } from '@/hooks';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { fetchSuggestions } from '@/handlers/ens';
import { ethereumUtils } from '@/utils';
import { getPoapAndOpenSheetWithQRHash, getPoapAndOpenSheetWithSecretWord } from '@/utils/poaps';
import { navigateToMintCollection } from '@/resources/reservoir/mints';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { navbarHeight } from '@/components/navbar/Navbar';
import { IS_TEST } from '@/env';
import { useTheme } from '@/theme';
import { EnrichedExchangeAsset } from '@/components/ExchangeAssetList';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { useTimeoutEffect } from '@/hooks/useTimeout';
import { useDiscoverSearchQueryStore, useDiscoverSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountAddress } from '@/state/wallets/walletsStore';

type EnsResult = {
  address: string;
  color: string;
  ens: boolean;
  image: string;
  network: string;
  nickname: string;
  uniqueId: string;
};

type EnsSearchResult = {
  color: string;
  data: EnsResult[];
  key: string;
  title: string;
};

export default function DiscoverSearch() {
  const accountAddress = useAccountAddress();
  const { colors } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [isFetchingEns, setIsFetchingEns] = useState(false);
  const { cancelSearch, searchInputRef, sectionListRef } = useDiscoverScreenContext();
  const isLoading = useDiscoverSearchStore(state => state.getStatus().isFetching);
  const { isSearching, searchQuery } = useDiscoverSearchQueryStore(state => {
    return {
      searchQuery: state.searchQuery,
      isSearching: state.isSearching,
    };
  });
  const [searchQueryForSearch] = useDebounce(searchQuery, 350);
  const [searchQueryForPoap] = useDebounce(searchQueryForSearch, 800);

  const lastSearchQuery = usePrevious(searchQueryForSearch);

  const [ensResults, setEnsResults] = useState<EnsSearchResult[]>([]);
  const { swapCurrencyList, swapCurrencyListLoading } = useSearchCurrencyList();

  const profilesEnabled = useExperimentalFlag(PROFILES);
  const TOP_OFFSET = safeAreaInsets.top + navbarHeight;

  const currencyList = useMemo(() => {
    // order:
    // 1. favorites
    // 2. verified
    // 3. profiles
    // 4. unverified high liquidity
    // 5. low liquidity
    let list = [...swapCurrencyList];
    const listKeys = swapCurrencyList.map(item => item.key);

    const profilesSecond = (listKeys[0] === 'favorites' && listKeys[1] !== 'verified') || listKeys[0] === 'verified';
    const profilesThird =
      listKeys[1] === 'verified' || listKeys[0] === 'unfilteredFavorites' || (listKeys[0] === 'favorites' && listKeys[1] === 'verified');

    if (profilesSecond) {
      list.splice(1, 0, ...ensResults);
    } else if (profilesThird) {
      list.splice(2, 0, ...ensResults);
    } else {
      list = [...ensResults, ...swapCurrencyList];
    }

    // ONLY FOR e2e!!! Include index along with section key to confirm order while testing for visibility
    if (IS_TEST) {
      list = list.map((section, index) => ({
        ...section,
        key: `${section.key}-${index}`,
      }));
    }
    return list.filter(section => section.data.length > 0);
  }, [swapCurrencyList, ensResults]);

  const currencyListDataKey = useMemo(
    () => `${swapCurrencyList?.[0]?.data?.[0]?.address || '_'}_${ensResults?.[0]?.data?.[0]?.address || '_'}`,
    [ensResults, swapCurrencyList]
  );

  useHardwareBackOnFocus(() => {
    cancelSearch();
    // prevent other back handlers from firing
    return true;
  });

  useEffect(() => {
    const checkAndHandlePoaps = async (secretWordOrHash: string) => {
      await getPoapAndOpenSheetWithSecretWord(secretWordOrHash);
      await getPoapAndOpenSheetWithQRHash(secretWordOrHash);
    };
    checkAndHandlePoaps(searchQueryForPoap);
  }, [searchQueryForPoap]);

  useEffect(() => {
    // probably dont need this entry point but seems worth keeping?
    // could do the same with zora, etc
    const checkAndHandleMint = async (seachQueryForMint: string) => {
      if (seachQueryForMint.includes('mint.fun')) {
        const mintdotfunURL = seachQueryForMint.split('https://mint.fun/');
        const query = mintdotfunURL[1];
        const [networkName] = query.split('/');
        let chainId = useBackendNetworksStore.getState().getChainsIdByName()[networkName];
        if (!chainId) {
          switch (networkName) {
            case 'op':
              chainId = ChainId.optimism;
              break;
            case 'ethereum':
              chainId = ChainId.mainnet;
              break;
            case 'zora':
              chainId = ChainId.zora;
              break;
            case 'base':
              chainId = ChainId.base;
              break;
          }
        }
        const contractAddress = query.split('/')[1];
        navigateToMintCollection(contractAddress, undefined, chainId);
        useDiscoverSearchQueryStore.setState({ searchQuery: '' });
      }
    };
    checkAndHandleMint(searchQuery);
  }, [accountAddress, searchQuery]);

  const handlePress = useCallback(
    (item: EnrichedExchangeAsset) => {
      if (item.ens) {
        // navigate to Showcase sheet
        searchInputRef?.current?.blur();
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET, {
            address: item.nickname,
            fromRoute: 'DiscoverSearch',
          });
          if (profilesEnabled) {
            analytics.track(analytics.event.viewedEnsProfile, {
              category: 'profiles',
              ens: item.nickname,
              from: 'Discover search',
            });
          }
        });
      } else {
        const accountAsset = ethereumUtils.getAccountAsset(item.uniqueId);
        if (item.favorite) {
          item.network = Network.mainnet;
        }
        const asset = accountAsset || item;
        Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
          asset,
          address: item.address,
          chainId: item.chainId,
        });
      }
    },
    [profilesEnabled, searchInputRef]
  );

  const itemProps = useMemo(
    () => ({
      onPress: handlePress,
      showFavoriteButton: true,
      showBalance: false,
    }),
    [handlePress]
  );

  const addEnsResults = useCallback(
    (ensResults: EnsResult[]) => {
      let ensSearchResults: EnsSearchResult[] = [];
      if (ensResults && ensResults.length) {
        ensSearchResults = [
          {
            color: colors.appleBlue,
            data: ensResults,
            key: 'profiles',
            title: `􀉮 ${lang.t('discover.search.profiles')}`,
          },
        ];
      }
      setEnsResults(ensSearchResults);
    },
    [colors.appleBlue]
  );

  useEffect(() => {
    if (searchQueryForSearch && lastSearchQuery !== searchQueryForSearch) {
      fetchSuggestions(searchQueryForSearch, addEnsResults, setIsFetchingEns, profilesEnabled);
    }
  }, [addEnsResults, lastSearchQuery, setIsFetchingEns, profilesEnabled, searchQueryForSearch]);

  useEffect(() => {
    if (!sectionListRef.current?.props.data?.length) {
      return;
    }

    sectionListRef.current.scrollToLocation({
      itemIndex: 0,
      sectionIndex: 0,
      animated: true,
    });
  }, [sectionListRef, isSearching]);

  useTimeoutEffect(
    () => {
      const assets = currencyList
        .filter(a => a.key !== 'profiles')
        .map(asset => asset.data)
        .flat();
      if (assets.length === 0) return;
      const params = {
        screen: 'discover' as const,
        no_icon: 0,
        no_price: 0,
        total_tokens: assets.length,
        query: searchQueryForSearch,
      };
      for (const asset of assets) {
        if (!asset.icon_url) params.no_icon += 1;
        if (!isNaN(asset.price?.value)) params.no_price += 1;
      }
      analytics.track(analytics.event.tokenList, params);
    },
    { timeout: 3000, enabled: !isLoading }
  );

  return (
    <View
      key={currencyListDataKey}
      style={{ height: deviceUtils.dimensions.height - TOP_OFFSET - TAB_BAR_HEIGHT }}
      testID="discover-search-list"
    >
      <CurrencySelectionList
        footerSpacer
        fromDiscover
        itemProps={itemProps}
        keyboardDismissMode="on-drag"
        // @ts-expect-error - FIXME: ens results / rainbow token results are not compatible with one another
        listItems={currencyList}
        loading={swapCurrencyListLoading || isFetchingEns}
        query={searchQueryForSearch}
        ref={sectionListRef}
        showList
        testID="discover-currency-select-list"
      />
    </View>
  );
}
