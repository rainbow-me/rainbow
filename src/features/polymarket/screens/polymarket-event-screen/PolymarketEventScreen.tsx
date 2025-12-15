import React, { memo, useMemo } from 'react';
import { Bleed, Box, globalColors, Separator, Text, useColorMode } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OpenPositionsSection } from '@/features/polymarket/screens/polymarket-event-screen/OpenPositionsSection';
import SlackSheet from '@/components/sheet/SlackSheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import ImgixImage from '@/components/images/ImgixImage';
import { MarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/MarketsSection';
import { formatNumber } from '@/helpers/strings';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { PolymarketChart } from '@/features/charts/polymarket/components/PolymarketChart';
import { PolymarketTimeframeSelector } from '@/features/charts/polymarket/components/PolymarketTimeframeSelector';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { SportsEventMarkets } from '@/features/polymarket/screens/polymarket-event-screen/SportsEventMarkets';
import { getChartLineColors } from '@/features/charts/polymarket/utils/getChartLineColors';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { AboutSection } from '@/features/polymarket/screens/polymarket-event-screen/AboutSection';
import { GameBoxScore } from '@/features/polymarket/screens/polymarket-event-screen/components/GameBoxScore';
import { ResolvedEventHeader } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedEventHeader';

export const EventHeaderSection = memo(function EventHeaderSection({ event }: { event: PolymarketMarketEvent | PolymarketEvent }) {
  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-start" gap={16}>
        <Box gap={20} style={{ flex: 1 }}>
          <Text color={'label'} size="30pt" weight="heavy" align="left">
            {event.title}
          </Text>
          <Text color={'labelQuaternary'} size="15pt" weight="bold">
            {`${formatNumber(String(event.volume), { useOrderSuffix: true, decimals: 1, style: '$' })} VOL`}
          </Text>
        </Box>
        <ImgixImage
          enableFasterImage
          resizeMode="cover"
          size={64}
          source={{ uri: event.icon }}
          style={{ height: 64, width: 64, borderRadius: 9 }}
        />
      </Box>
    </Box>
  );
});

const ChartSection = memo(function ChartSection({
  backgroundColor,
  lineColors,
}: {
  backgroundColor: string;
  lineColors?: readonly [string, string, string, string, string];
}) {
  return (
    <Bleed horizontal="24px">
      <Box borderRadius={16} gap={8} overflow="hidden" width={DEVICE_WIDTH}>
        <PolymarketChart
          backgroundColor={backgroundColor}
          config={lineColors ? { line: { colors: lineColors, overrideSeriesColors: true } } : undefined}
        />
        <PolymarketTimeframeSelector backgroundColor={backgroundColor} color={globalColors.white100} />
      </Box>
    </Bleed>
  );
});

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

export const PolymarketEventScreen = memo(function PolymarketEventScreen() {
  const {
    params: { event: initialEvent, eventId },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_EVENT_SCREEN>>();

  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const eventData = usePolymarketEventStore(state => state.getData());
  const event = eventData ?? initialEvent;

  const backgroundColor = isDarkMode
    ? getSolidColorEquivalent({ background: initialEvent.color, foreground: '#000000', opacity: 0.92 })
    : '#FFFFFF';

  const isSportsEvent = initialEvent.gameId !== undefined;
  const lineColors = useMemo(() => parseLineColors(event, isSportsEvent), [event, isSportsEvent]);
  const isEventResolved = event.closed;
  const shouldShowChart = !isEventResolved;

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
        <Box
          gap={28}
          paddingTop={{ custom: 96 }}
          paddingBottom={{ custom: safeAreaInsets.bottom }}
          paddingHorizontal="24px"
          style={{ minHeight: DEVICE_HEIGHT }}
        >
          {isEventResolved && <ResolvedEventHeader resolvedAt={event.closedTime} />}
          <EventHeaderSection event={event} />
          {isSportsEvent && <GameBoxScore event={event} />}
          {shouldShowChart && <ChartSection backgroundColor={backgroundColor} lineColors={lineColors} />}
          <OpenPositionsSection eventId={eventId} />
          {isSportsEvent ? <SportsEventMarkets /> : <MarketsSection />}
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <AboutSection />
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

function parseLineColors(
  event: PolymarketEvent | PolymarketMarketEvent,
  isSportsEvent: boolean
): readonly [string, string, string, string, string] | undefined {
  if (isSportsEvent) return undefined;
  if (!('markets' in event)) return undefined;
  return getChartLineColors(event.markets);
}
