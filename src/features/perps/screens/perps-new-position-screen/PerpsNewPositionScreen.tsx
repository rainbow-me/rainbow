import React, { memo } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Box, Separator, Stack, useColorMode } from '@/design-system';
import { AmountInputCard } from './AmountInputCard';
import { LeverageInputCard } from './LeverageInputCard';
import { POSITION_SIDE_SELECTOR_HEIGHT_WITH_PADDING, PositionSideSelector } from './PositionSideSelector';
import { DetailsSection } from './DetailsSection';
import { useOnLeaveRoute } from '@/hooks/useOnLeaveRoute';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { LiquidationInfo } from '@/features/perps/screens/perps-new-position-screen/LiquidationInfo';
import { TriggerOrdersSection } from '@/features/perps/screens/perps-new-position-screen/TriggerOrdersSection';
import { FOOTER_HEIGHT_WITH_SAFE_AREA, LAYOUT_ANIMATION, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { MarketInfoSection } from './MarketInfoSection';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { HeaderFade } from '@/features/perps/components/HeaderFade';
import { IS_ANDROID } from '@/env';
import { PerpMarket } from '@/features/perps/types';
import { useStableValue } from '@/hooks/useStableValue';

export const PerpsNewPositionScreen = memo(function PerpsNewPositionScreen() {
  const { isDarkMode } = useColorMode();
  const market = useHlNewPositionStore(state => state.market);
  const screenBackgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  useOnLeaveRoute(Keyboard.dismiss);

  if (!market) return null;

  return (
    <Box backgroundColor={screenBackgroundColor} style={{ flex: 1, width: '100%' }}>
      <Box style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInset={{ bottom: FOOTER_HEIGHT_WITH_SAFE_AREA }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            overflow: 'visible',
            paddingTop: POSITION_SIDE_SELECTOR_HEIGHT_WITH_PADDING,
            paddingBottom: IS_ANDROID ? FOOTER_HEIGHT_WITH_SAFE_AREA : 0,
          }}
        >
          <Box paddingTop={'24px'}>
            <Stack
              space={'24px'}
              separator={
                <Box paddingHorizontal={'8px'}>
                  <Separator color={'separatorTertiary'} thickness={THICK_BORDER_WIDTH} />
                </Box>
              }
            >
              <MarketInfoSection market={market} />
              <Box gap={20}>
                <AmountInputCard />
                <LeverageSection market={market} />
              </Box>
              <Animated.View layout={LAYOUT_ANIMATION}>
                <DetailsSection market={market} />
              </Animated.View>
            </Stack>
          </Box>
        </ScrollView>

        <HeaderFade topInset={POSITION_SIDE_SELECTOR_HEIGHT_WITH_PADDING} />
        <Box
          backgroundColor={screenBackgroundColor}
          overflow={'visible'}
          paddingTop={'8px'}
          position={'absolute'}
          justifyContent={'center'}
          alignItems={'center'}
          style={{ alignSelf: 'center', width: '100%', zIndex: 1000 }}
        >
          <PositionSideSelector />
        </Box>
      </Box>
    </Box>
  );
});

const LeverageSection = ({ market }: { market: PerpMarket }) => {
  const initialLeverage = useStableValue(() => hlNewPositionStoreActions.getLeverage() ?? 1);
  const leverage = useSharedValue(initialLeverage);
  return (
    <>
      <LeverageInputCard initialLeverage={initialLeverage} leverage={leverage} />
      <Box gap={32}>
        <Box paddingHorizontal="8px">
          <LiquidationInfo market={market} leverage={leverage} />
        </Box>
        <TriggerOrdersSection />
      </Box>
    </>
  );
};
