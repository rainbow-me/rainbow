import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Box } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { easing } from '@/components/animations/animationConfigs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { PolymarketTabSelector } from './PolymarketTabSelector';
import { PolymarketSearchBar } from '@/features/polymarket/screens/polymarket-navigator/PolymarketSearchBar';

export const PolymarketNavigatorFooter = function PolymarketNavigatorFooter() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <EasingGradient
        easing={easing.in.sin}
        startColor={opacityWorklet('#000000', 0)}
        endColor={opacityWorklet('#000000', 1)}
        startPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 0, y: 0.8 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 152, width: '100%' }}
      />
      <Box position="absolute" left="0px" right="0px" bottom="0px" width="full" paddingHorizontal="16px">
        <View style={[styles.container, { paddingBottom: safeAreaInsets.bottom }]}>
          <PolymarketTabSelector />
          <PolymarketSearchBar />
        </View>
      </Box>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
