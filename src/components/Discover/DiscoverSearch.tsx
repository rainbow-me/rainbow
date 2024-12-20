import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import * as lang from '@/languages';
import deviceUtils from '@/utils/deviceUtils';
import CurrencySelectionList from '@/components/CurrencySelectionList';
import { Row } from '@/components/layout';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { analytics, analyticsV2 } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { useAccountSettings, useSearchCurrencyList, usePrevious, useHardwareBackOnFocus } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { fetchSuggestions } from '@/handlers/ens';
import styled from '@/styled-thing';
import { ethereumUtils, safeAreaInsetValues } from '@/utils';
import { getPoapAndOpenSheetWithQRHash, getPoapAndOpenSheetWithSecretWord } from '@/utils/poaps';
import { navigateToMintCollection } from '@/resources/reservoir/mints';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { navbarHeight } from '@/components/navbar/Navbar';
import { IS_TEST } from '@/env';
import { uniqBy } from 'lodash';
import { useTheme } from '@/theme';
import { EnrichedExchangeAsset } from '@/components/ExchangeAssetList';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { useTimeoutEffect } from '@/hooks/useTimeout';

export const SearchContainer = styled(Row)({
  height: '100%',
});

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
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();

  const {
    isSearching,
    isLoading,
    isFetchingEns,
    setIsLoading,
    setIsFetchingEns,
    cancelSearch,
    setSearchQuery,
    searchQuery,
    searchInputRef,
    sectionListRef,
  } = useDiscoverScreenContext();

  const [searchQueryForSearch] = useDebounce(searchQuery, 350);
  const [searchQueryForPoap] = useDebounce(searchQueryForSearch, 800);

  const lastSearchQuery = usePrevious(searchQueryForSearch);

  const [ensResults, setEnsResults] = useState<EnsSearchResult[]>([]);
  const { swapCurrencyList, swapCurrencyListLoading } = useSearchCurrencyList(searchQueryForSearch, ChainId.mainnet);

  const profilesEnabled = useExperimentalFlag(PROFILES);
  const marginBottom = TAB_BAR_HEIGHT + safeAreaInsetValues.bottom + 16;
  const TOP_OFFSET = safeAreaInsetValues.top + navbarHeight;

  const currencyList = useMemo(() => {
    // order:
    // 1. favorites
    // 2. verified
    // 3. profiles
    // 4. unverified
    // 5. low liquidity
    let list = swapCurrencyList;
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

    // ONLY FOR e2e!!! Fake tokens with same symbols break detox e2e tests
    if (IS_TEST) {
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
        setSearchQuery('');
      }
    };
    checkAndHandleMint(searchQuery);
  }, [accountAddress, navigate, searchQuery, setSearchQuery]);

  const handlePress = useCallback(
    (item: EnrichedExchangeAsset) => {
      if (item.ens) {
        // navigate to Showcase sheet
        searchInputRef?.current?.blur();
        InteractionManager.runAfterInteractions(() => {
          navigate(profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET, {
            address: item.nickname,
            fromRoute: 'DiscoverSearch',
          });
          if (profilesEnabled) {
            analytics.track('Viewed ENS profile', {
              category: 'profiles',
              ens: item.nickname,
              from: 'Discover search',
            });
          }
        });
      } else {
        const asset = ethereumUtils.getAccountAsset(item.uniqueId);
        if (item.favorite) {
          item.network = Network.mainnet;
        }
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: asset || item,
          fromDiscover: true,
          type: 'token',
        });
      }
    },
    [navigate, profilesEnabled, searchInputRef]
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
    if (searchQueryForSearch && !isLoading) {
      if (lastSearchQuery !== searchQueryForSearch) {
        setIsLoading(true);
        fetchSuggestions(searchQuery, addEnsResults, setIsFetchingEns, profilesEnabled);
      }
    }
  }, [
    addEnsResults,
    isSearching,
    lastSearchQuery,
    searchQuery,
    setIsFetchingEns,
    profilesEnabled,
    isLoading,
    setIsLoading,
    searchQueryForSearch,
  ]);

  useEffect(() => {
    if (!swapCurrencyListLoading && !isFetchingEns) {
      setIsLoading(false);
    }
  }, [isFetchingEns, setIsLoading, swapCurrencyListLoading]);

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
      analyticsV2.track(analyticsV2.event.tokenList, params);
    },
    { timeout: 3000, enabled: !isLoading }
  );

  return (
    <View key={currencyListDataKey} style={{ height: deviceUtils.dimensions.height - TOP_OFFSET - marginBottom }}>
      <SearchContainer>
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
      </SearchContainer>
    </View>
  );
}
