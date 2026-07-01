import React, { useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from 'use-debounce';

import { useDiscoverSearchQueryStore, useDiscoverSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { analytics } from '@/analytics';
import CurrencySelectionList from '@/components/CurrencySelectionList';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { type EnrichedExchangeAsset } from '@/components/ExchangeAssetList';
import { IS_TEST } from '@/env';
import { DISCOVER_HEADER_HEIGHT } from '@/features/discover/components/DiscoverHeader';
import { Network } from '@/features/network/types/backendNetworks';
import { useHardwareBackOnFocus } from '@/framework/ui/hooks/useHardwareBack';
import useSearchCurrencyList from '@/hooks/useSearchCurrencyList';
import { useTimeoutEffect } from '@/hooks/useTimeout';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import deviceUtils from '@/utils/deviceUtils';
import ethereumUtils from '@/utils/ethereumUtils';

export default function DiscoverSearch() {
  const safeAreaInsets = useSafeAreaInsets();

  const { cancelSearch, sectionListRef } = useDiscoverScreenContext();
  const isLoading = useDiscoverSearchStore(state => state.getStatus('isLoading'));
  const { isSearching, searchQuery } = useDiscoverSearchQueryStore(state => {
    return {
      searchQuery: state.searchQuery,
      isSearching: state.isSearching,
    };
  });
  const [searchQueryForSearch] = useDebounce(searchQuery, 350);

  const { swapCurrencyList, swapCurrencyListLoading } = useSearchCurrencyList();

  const TOP_OFFSET = safeAreaInsets.top + DISCOVER_HEADER_HEIGHT;

  const currencyList = useMemo(() => {
    // order:
    // 1. favorites
    // 2. verified
    // 3. unverified high liquidity
    // 4. low liquidity
    let list = [...swapCurrencyList];

    // ONLY FOR e2e!!! Include index along with section key to confirm order while testing for visibility
    if (IS_TEST) {
      list = list.map((section, index) => ({
        ...section,
        key: `${section.key}-${index}`,
      }));
    }
    return list.filter(section => section.data.length > 0);
  }, [swapCurrencyList]);

  const currencyListDataKey = useMemo(() => `${swapCurrencyList?.[0]?.data?.[0]?.address || '_'}`, [swapCurrencyList]);

  useHardwareBackOnFocus(() => {
    cancelSearch();
    // prevent other back handlers from firing
    return true;
  });

  const handlePress = useCallback((item: EnrichedExchangeAsset) => {
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
  }, []);

  const itemProps = useMemo(
    () => ({
      onPress: handlePress,
      showFavoriteButton: true,
      showBalance: false,
    }),
    [handlePress]
  );

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
      const assets = currencyList.map(asset => asset.data).flat();
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
        listItems={currencyList}
        loading={swapCurrencyListLoading}
        query={searchQueryForSearch}
        ref={sectionListRef}
        showList
        testID="discover-currency-select-list"
      />
    </View>
  );
}
