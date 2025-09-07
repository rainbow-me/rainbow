import React, { memo, useEffect } from 'react';
import { Box, Separator, Stack, useBackgroundColor } from '@/design-system';
import { AmountInputCard } from './AmountInputCard';
import { LeverageInputCard } from './LeverageInputCard';
import { PositionSideSelector } from './PositionSideSelector';
import { DetailsSection } from './DetailsSection';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { LiquidationInfo } from '@/features/perps/screens/perps-new-position-screen/LiquidationInfo';
import { TriggerOrdersSection } from '@/features/perps/screens/perps-new-position-screen/TriggerOrdersSection';
import { ScrollView } from 'react-native';
import { FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { MarketInfoSection } from './MarketInfoSection';

export const PerpsNewPositionScreen = memo(function PerpsNewPositionScreen() {
  const market = useHlNewPositionStore(state => state.market);
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');

  useEffect(() => {
    return () => {
      hlNewPositionStoreActions.reset();
    };
  }, []);

  if (!market) return null;

  return (
    <Box background={'surfacePrimary'} paddingHorizontal={'20px'} style={{ flex: 1 }}>
      {/* TODO (kane): shadow is being clipped, might be able to fix by moving to a sticky header */}
      <Box overflow={'visible'} paddingBottom={'24px'} paddingTop={'8px'}>
        <PositionSideSelector />
      </Box>
      <Box style={{ flex: 1, position: 'relative' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentInset={{ bottom: FOOTER_HEIGHT_WITH_SAFE_AREA }}>
          <Box paddingTop={'24px'}>
            <Stack space={'24px'} separator={<Separator color={'separatorTertiary'} direction="horizontal" />}>
              <MarketInfoSection market={market} />
              <Box gap={17}>
                <Box gap={24}>
                  <AmountInputCard />
                  <LeverageInputCard market={market} />
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
          style={{
            height: 32,
            width: DEVICE_WIDTH,
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        />
      </Box>
    </Box>
  );
});
