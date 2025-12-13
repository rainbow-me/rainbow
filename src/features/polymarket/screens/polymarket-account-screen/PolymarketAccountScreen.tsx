import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { Box, Separator, useColorMode } from '@/design-system';
import { PolymarketAccountBalanceCard } from '@/features/polymarket/components/PolymarketAccountBalanceCard';
import { PolymarketOpenPositionsSection } from '@/features/polymarket/components/PolymarketOpenPositionsSection';
import {
  NAVIGATOR_FOOTER_CLEARANCE,
  NAVIGATOR_FOOTER_HEIGHT,
  POLYMARKET_BACKGROUND_DARK,
  POLYMARKET_BACKGROUND_LIGHT,
} from '@/features/polymarket/constants';

export const PolymarketAccountScreen = function PolymarketAccountScreen() {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);

  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;
  const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;

  return (
    <View style={styles.container}>
      <Animated.ScrollView contentContainerStyle={[styles.scrollViewContentContainer, { paddingBottom }]} onScroll={onScroll}>
        <Box gap={20} width="full">
          <PolymarketAccountBalanceCard accentColor={'#C55DE7'} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
          <View style={styles.openPositionsSectionContainer}>
            <PolymarketOpenPositionsSection />
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
