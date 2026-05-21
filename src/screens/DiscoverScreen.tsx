import React, { memo, useCallback, useEffect, useState } from 'react';
import { Keyboard, RefreshControl } from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { DiscoverScreenContent } from '@/components/Discover/DiscoverScreenContent';
import { DiscoverScreenProvider } from '@/components/Discover/DiscoverScreenContext';
import { DiscoverSearchBar } from '@/components/Discover/DiscoverSearchBar';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { Box, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { DISCOVER_HEADER_HEIGHT, DiscoverHeader } from '@/features/discover/components/DiscoverHeader';
import { DISCOVER_SCREEN_BACKGROUND_COLOR } from '@/features/discover/constants';
import { getPolymarketEventsByTagStore } from '@/features/discover/stores/polymarketEventsByTagStore';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { CATEGORIES } from '@/features/polymarket/constants';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';

export const DiscoverScreen = () => {
  return (
    <DiscoverScreenProvider>
      <Content />
    </DiscoverScreenProvider>
  );
};

const Content = () => {
  const { colorMode } = useColorMode();
  const { top: topInset } = useSafeAreaInsets();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  const backgroundColor = getValueForColorMode(DISCOVER_SCREEN_BACKGROUND_COLOR, colorMode);
  const headerFadeTopInset = topInset + DISCOVER_HEADER_HEIGHT;
  const scrollOffset = useSharedValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshDiscover = useCallback(async () => {
    setIsRefreshing(true);

    await Promise.allSettled([
      usePlacementsStore.getState().fetch(undefined, { force: true }),
      useHyperliquidMarketsStore.getState().fetch(undefined, { force: true }),
      usePredictionEventsStore.getState().fetch(undefined, { force: true }),
      useTokenRefsStore.getState().fetch(undefined, { force: true }),
      usePolymarketEventsStore.getState().fetch(undefined, { force: true }),
      usePolymarketSportsEventsStore.getState().fetch(undefined, { force: true }),
      getPolymarketEventsByTagStore(CATEGORIES.crypto.tagId).getState().fetch(undefined, { force: true }),
      getPolymarketEventsByTagStore(CATEGORIES.finance.tagId).getState().fetch(undefined, { force: true }),
    ]);

    setIsRefreshing(false);
  }, []);

  const renderRefreshControl = useCallback(
    () => <RefreshControl onRefresh={refreshDiscover} refreshing={isRefreshing} tintColor={colorMode === 'dark' ? '#FFFFFF' : '#000000'} />,
    [colorMode, isRefreshing, refreshDiscover]
  );

  return (
    <Box height="full" style={{ flex: 1, backgroundColor }}>
      <Box paddingTop={{ custom: topInset }}>{isSearching ? <DiscoverSearchBar /> : <DiscoverHeader />}</Box>

      <Box style={{ flex: 1 }} testID="discover-sheet">
        <DiscoverScreenContent renderRefreshControl={renderRefreshControl} scrollOffset={scrollOffset} />
      </Box>

      {!isSearching ? <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} topInset={headerFadeTopInset} /> : null}

      <KeyboardDismissHandler />
    </Box>
  );
};

const KeyboardDismissHandler = memo(function KeyboardDismissHandler() {
  const isFocused = useIsFocused();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  useEffect(() => {
    const shouldDismiss = !isFocused && isSearching;
    if (shouldDismiss) Keyboard.dismiss();
  }, [isFocused, isSearching]);

  return null;
});
