import React, { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Bleed, Box, Separator, Stack, useBackgroundColor } from '@/design-system';
import { AmountInputCard } from './AmountInputCard';
import { LeverageInputCard } from './LeverageInputCard';
import { PositionSideSelector } from './PositionSideSelector';
import { DetailsSection } from './DetailsSection';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { LiquidationInfo } from '@/features/perps/screens/perps-new-position-screen/LiquidationInfo';
import { TriggerOrdersSection } from '@/features/perps/screens/perps-new-position-screen/TriggerOrdersSection';
import { FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { MarketInfoSection } from './MarketInfoSection';
import { AmountInputError } from '@/features/perps/screens/perps-new-position-screen/AmountError';

export const PerpsNewPositionScreen = memo(function PerpsNewPositionScreen() {
  const market = useHlNewPositionStore(state => state.market);
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');

  if (!market) return null;

  return (
    <Box background={'surfacePrimary'} style={{ flex: 1 }}>
      {/* TODO (kane): shadow - disabled for now - is being clipped, might be able to fix by moving to a sticky header */}
      <Box overflow={'visible'} paddingTop={'8px'} justifyContent={'center'} alignItems={'center'}>
        <PositionSideSelector />
      </Box>
      <Box style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInset={{ bottom: FOOTER_HEIGHT_WITH_SAFE_AREA }}
          contentContainerStyle={{ paddingHorizontal: 20, overflow: 'visible' }}
        >
          <Box paddingTop={'24px'}>
            <Stack space={'24px'} separator={<Separator color={'separatorTertiary'} direction="horizontal" />}>
              <MarketInfoSection market={market} />
              <Box gap={17}>
                <Box gap={24}>
                  <Bleed horizontal={'20px'}>
                    <Box paddingHorizontal={'20px'}>
                      <AmountInputCard />
                      <AmountInputError />
                    </Box>
                  </Bleed>
                  <LeverageInputCard maxLeverage={market.maxLeverage} />
                </Box>
                <Box paddingHorizontal={'8px'}>
                  <LiquidationInfo market={market} />
                </Box>
              </Box>
              <TriggerOrdersSection />
              <DetailsSection market={market} />
            </Stack>
          </Box>
        </ScrollView>
        <EasingGradient
          endColor={screenBackgroundColor}
          startColor={screenBackgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={styles.easingGradient}
        />
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  easingGradient: {
    height: 32,
    width: DEVICE_WIDTH,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
