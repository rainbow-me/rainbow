import React, { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { Box, Separator, useColorMode } from '@/design-system';
import { PolymarketAccountBalanceCard } from '@/features/polymarket/components/PolymarketAccountBalanceCard';
import { PolymarketPositionsSection } from '@/features/polymarket/components/PolymarketOpenPositionsSection';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import {
  NAVIGATOR_FOOTER_CLEARANCE,
  NAVIGATOR_FOOTER_HEIGHT,
  POLYMARKET_BACKGROUND_DARK,
  POLYMARKET_BACKGROUND_LIGHT,
} from '@/features/polymarket/constants';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

export const PolymarketAccountScreen = function PolymarketAccountScreen() {
  const { isDarkMode } = useColorMode();
  const { accountScrollRef } = usePolymarketContext();
  const safeAreaInsets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);

  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;
  const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refetchPolymarketStores(), delay(time.seconds(1))]);
    setIsRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollViewContentContainer, { paddingBottom }]}
        onScroll={onScroll}
        ref={accountScrollRef}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Box gap={20} width="full">
          <PolymarketAccountBalanceCard accentColor={'#C55DE7'} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
          <View style={styles.openPositionsSectionContainer}>
            <PolymarketPositionsSection />
          </View>
        </Box>
      </Animated.ScrollView>
      <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  openPositionsSectionContainer: {
    paddingHorizontal: 8,
  },
});
