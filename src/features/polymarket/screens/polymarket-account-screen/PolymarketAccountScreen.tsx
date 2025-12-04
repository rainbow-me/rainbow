import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Box, Separator } from '@/design-system';
import { PolymarketAccountBalanceCard } from '@/features/polymarket/components/PolymarketAccountBalanceCard';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { PolymarketOpenPositionsSection } from '@/features/polymarket/components/PolymarketOpenPositionsSection';
import { NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PolymarketAccountScreen = function PolymarketAccountScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollViewContentContainer, { paddingBottom }]}>
        <Box gap={20} width="full">
          <PolymarketAccountBalanceCard accentColor={'#C55DE7'} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
          <View style={styles.openPositionsSectionContainer}>
            <PolymarketOpenPositionsSection />
          </View>
        </Box>
      </ScrollView>
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
