import React, { memo, useEffect } from 'react';
import { Keyboard } from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { DiscoverScreenContent } from '@/components/Discover/DiscoverScreenContent';
import { DiscoverScreenProvider } from '@/components/Discover/DiscoverScreenContext';
import { DiscoverSearchBar } from '@/components/Discover/DiscoverSearchBar';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { Box, useBackgroundColor, useColorMode } from '@/design-system';
import { type BackgroundColor } from '@/design-system/color/palettes';
import { DISCOVER_HEADER_HEIGHT, DiscoverHeader } from '@/features/discover/components/DiscoverHeader';
import { useSyncDiscoverSurfacePlacements } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';

export const DiscoverScreen = () => {
  return (
    <DiscoverScreenProvider>
      <Content />
    </DiscoverScreenProvider>
  );
};

const Content = () => {
  const { isDarkMode } = useColorMode();
  const { top: topInset } = useSafeAreaInsets();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  const backgroundToken: BackgroundColor = isDarkMode ? 'black' : 'surfacePrimary';
  const backgroundColor = useBackgroundColor(backgroundToken);
  const headerFadeTopInset = topInset + DISCOVER_HEADER_HEIGHT;
  const scrollOffset = useSharedValue(0);
  useSyncDiscoverSurfacePlacements();

  return (
    <Box background={backgroundToken} height="full" style={{ flex: 1 }}>
      <Box paddingTop={{ custom: topInset }}>{isSearching ? <DiscoverSearchBar /> : <DiscoverHeader />}</Box>

      <Box style={{ flex: 1 }} testID="discover-sheet">
        <DiscoverScreenContent scrollOffset={scrollOffset} />
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
