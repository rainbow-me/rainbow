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
import { Box, useBackgroundColor, useForegroundColor } from '@/design-system';
import { DiscoverHeader } from '@/features/discover/components/DiscoverHeader';
import { DISCOVER_HEADER_HEIGHT } from '@/features/discover/components/discoverHeaderLayout';
import { refreshDiscoverSurface } from '@/features/discover/utils/refreshDiscoverSurface';
import { useSyncDiscoverSurfacePlacements } from '@/features/placements/surfaces/hooks/useSurface';

export const DiscoverScreen = () => {
  return (
    <DiscoverScreenProvider>
      <Content />
    </DiscoverScreenProvider>
  );
};

const Content = () => {
  const { top: topInset } = useSafeAreaInsets();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  const backgroundColor = useBackgroundColor('surfacePrimary');
  const refreshTintColor = useForegroundColor('label');
  const headerFadeTopInset = topInset + DISCOVER_HEADER_HEIGHT;
  const scrollOffset = useSharedValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useSyncDiscoverSurfacePlacements();

  const refreshDiscover = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshDiscoverSurface('discover');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const renderRefreshControl = useCallback(
    () => <RefreshControl onRefresh={refreshDiscover} refreshing={isRefreshing} tintColor={refreshTintColor} />,
    [isRefreshing, refreshDiscover, refreshTintColor]
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
