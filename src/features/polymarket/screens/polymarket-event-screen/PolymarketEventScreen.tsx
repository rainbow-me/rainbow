import React, { memo } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Chart } from '@/components/value-chart/Chart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OpenPositionsSection } from '@/features/polymarket/screens/polymarket-event-screen/OpenPositionsSection';
import SlackSheet from '@/components/sheet/SlackSheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import ImgixImage from '@/components/images/ImgixImage';
import { MarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/MarketsSection';

export const EventHeaderSection = memo(function EventHeaderSection({ eventId }: { eventId: string }) {
  const event = usePolymarketEventStore(state => state.getData({ eventId }));
  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-start" gap={16}>
        <Box gap={12} style={{ flex: 1 }}>
          <Text color={'label'} size="30pt" weight="heavy" align="left">
            {event?.title}
          </Text>
          <Text color={'labelSecondary'} size="15pt" weight="bold">
            {event?.volume}
          </Text>
        </Box>
        <ImgixImage resizeMode="cover" size={64} source={{ uri: event?.icon }} style={{ height: 64, width: 64, borderRadius: 9 }} />
      </Box>
    </Box>
  );
});

export const ChartSection = memo(function ChartSection() {
  return null;
});

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

const PolymarketEventScreenContent = memo(function PolymarketEventScreenContent({ eventId }: { eventId: string }) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <SlackSheet
        backgroundColor={backgroundColor}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        showsVerticalScrollIndicator={false}
        additionalTopPadding={false}
        scrollIndicatorInsets={{
          bottom: safeAreaInsets.bottom,
          top: safeAreaInsets.top + 32,
        }}
      >
        <Box gap={28} paddingTop={{ custom: 96 }} paddingBottom={{ custom: safeAreaInsets.bottom }} paddingHorizontal="24px">
          <EventHeaderSection eventId={eventId} />
          <ChartSection />
          <OpenPositionsSection eventId={eventId} />
          <MarketsSection eventId={eventId} />
        </Box>
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={backgroundColor} height={safeAreaInsets.top + (IS_ANDROID ? 24 : 12)} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={backgroundColor}
          startColor={backgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
    </>
  );
});

export const PolymarketEventScreen = () => {
  const {
    params: { eventId },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_EVENT_SCREEN>>();

  return <PolymarketEventScreenContent eventId={eventId} />;
};
