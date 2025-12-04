import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Box, Separator } from '@/design-system';
import { PolymarketAccountBalanceCard } from '@/features/polymarket/components/PolymarketAccountBalanceCard';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { PolymarketOpenPositionsSection } from '@/features/polymarket/components/PolymarketOpenPositionsSection';
import { NAVIGATOR_FOOTER_CLEARANCE } from '@/features/polymarket/constants';

export const PolymarketAccountScreen = function PolymarketAccountScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
        <Box gap={20} width="full">
          <PolymarketAccountBalanceCard accentColor={'#C55DE7'} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
          <PolymarketOpenPositionsSection />
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
    paddingBottom: NAVIGATOR_FOOTER_CLEARANCE + 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
