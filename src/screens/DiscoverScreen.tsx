import React, { memo, useEffect, type ReactElement } from 'react';
import { Keyboard, Platform, type RefreshControlProps } from 'react-native';

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

import { PullToRefresh } from './Airdrops/AirdropsSheet';

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

  return (
    <Box height="full" style={{ flex: 1, backgroundColor }}>
      <Box paddingTop={{ custom: topInset }}>{isSearching ? <DiscoverSearchBar /> : <DiscoverHeader />}</Box>

      <Box style={{ flex: 1 }} testID="discover-sheet">
        <DiscoverScreenContent renderRefreshControl={Platform.OS === 'ios' ? renderPullToRefresh : undefined} scrollOffset={scrollOffset} />
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

function renderPullToRefresh(): ReactElement<RefreshControlProps> {
  return <PullToRefresh />;
}
