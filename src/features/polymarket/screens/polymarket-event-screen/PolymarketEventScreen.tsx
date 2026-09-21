import React, { memo, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useIsFocused, useRoute, type RouteProp } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import ImgixImage from '@/components/images/ImgixImage';
import SlackSheet from '@/components/sheet/SlackSheet';
import { Bleed, Box, globalColors, Separator, Text, useColorMode } from '@/design-system';
import { type ActiveInteractionData } from '@/features/charts/polymarket/classes/PolymarketChartManager';
import { PolymarketChart } from '@/features/charts/polymarket/components/PolymarketChart';
import { PolymarketChartHeader } from '@/features/charts/polymarket/components/PolymarketChartHeader';
import { PolymarketTimeframeSelector } from '@/features/charts/polymarket/components/PolymarketTimeframeSelector';
import { getChartLineColors } from '@/features/charts/polymarket/utils/getChartLineColors';
import { POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { AboutSection } from '@/features/polymarket/screens/polymarket-event-screen/AboutSection';
import { GameBoxScore } from '@/features/polymarket/screens/polymarket-event-screen/components/GameBoxScore';
import { ResolvedEventHeader } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedEventHeader';
import { MarketRowLoadingSkeleton } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { MarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/MarketsSection';
import { OpenPositionsSection } from '@/features/polymarket/screens/polymarket-event-screen/OpenPositionsSection';
import { SportsEventMarkets } from '@/features/polymarket/screens/polymarket-event-screen/SportsEventMarkets';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { type PolymarketEvent, type PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import { useSportsLookup } from '@/features/sports/ui/useSportsLookup';
import { formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getSolidColorEquivalent } from '@/worklets/colors';

// ============ Screen ========================================================= //

export const PolymarketEventScreen = memo(function PolymarketEventScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_EVENT_SCREEN>>();
  const eventId = 'gameId' in params ? params.gameId : params.eventId;
  const initialEvent = 'event' in params ? params.event : undefined;
  const { isDarkMode } = useColorMode();
  const eventData = usePolymarketEventStore(state => state.getData({ eventId }));
  const event = eventData ?? initialEvent;
  const gameId = useSportsStore(state => ('gameId' in params ? params.gameId : (state.games[eventId]?.id ?? state.eventGames[eventId])));
  const eventColor = getColorValueForThemeWorklet(event?.color, isDarkMode);
  let screenBackgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;
  if (isDarkMode && event) {
    screenBackgroundColor = getSolidColorEquivalent({ background: eventColor, foreground: '#000000', opacity: 0.92 });
  }

  return (
    <>
      <SportsEventLookup eventId={eventId} />
      <EventSheet backgroundColor={screenBackgroundColor}>
        {event?.closed && <ResolvedEventHeader resolvedAt={event.closedTime} />}
        {gameId ? <SportsGameOverview gameId={gameId} event={event} /> : event && <EventHeaderSection event={event} />}
        {event ? (
          <EventContent event={event} gameId={gameId} eventColor={eventColor} backgroundColor={screenBackgroundColor} />
        ) : (
          <EventDetailsStatus eventId={eventId} />
        )}
      </EventSheet>
    </>
  );
});

// ============ Content ======================================================== //

function EventContent({
  event,
  gameId,
  eventColor,
  backgroundColor,
}: {
  event: PolymarketEvent | PolymarketMarketEvent;
  gameId: string | null | undefined;
  eventColor: string;
  backgroundColor: string;
}) {
  const financialEvent = 'markets' in event ? event : null;

  return (
    <>
      {!event.closed && !gameId && <ChartSection event={event} backgroundColor={backgroundColor} />}
      <OpenPositionsSection eventId={event.id} eventColor={eventColor} />
      {financialEvent ? (
        gameId ? (
          <SportsEventMarkets event={financialEvent} />
        ) : (
          <MarketsSection event={financialEvent} />
        )
      ) : (
        <EventDetailsStatus eventId={event.id} />
      )}
      <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
      <AboutSection event={event} screenBackgroundColor={backgroundColor} />
    </>
  );
}

function EventDetailsStatus({ eventId }: { eventId: string }) {
  const failed = usePolymarketEventStore(state => state.status !== 'loading' && Boolean(state.getCacheEntry({ eventId })?.errorInfo));
  if (!failed) return <MarketRowLoadingSkeleton />;

  return (
    <Box alignItems="center" gap={20} paddingVertical="28px">
      <Text align="center" color="labelSecondary" size="17pt" weight="bold">
        {i18n.t(i18n.l.sports.event_error)}
      </Text>
      <ButtonPressAnimation onPress={() => usePolymarketEventStore.getState().fetch({ eventId }, { force: true })}>
        <Box background="fillTertiary" borderRadius={22} height={44} paddingHorizontal="20px" justifyContent="center">
          <Text color="accent" size="17pt" weight="bold">
            {i18n.t(i18n.l.sports.retry)}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

const EventHeaderSection = memo(function EventHeaderSection({ event }: { event: PolymarketMarketEvent | PolymarketEvent }) {
  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-start" gap={16}>
        <Box gap={20} style={{ flex: 1 }}>
          <Text color={'label'} size="30pt" weight="heavy" align="left">
            {event.title}
          </Text>
          <EventVolume volume={event.volume} />
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

function SportsGameOverview({ gameId, event }: { gameId: string; event?: PolymarketEvent | PolymarketMarketEvent }) {
  const competition = useSportsStore(state => {
    const id = state.games[gameId]?.competitionIds[0];
    return id ? state.catalog?.scopes[id] : undefined;
  });

  return (
    <>
      {competition ? (
        <Box gap={12}>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <SportsImage imageUrl={competition.imageUrl} name={competition.name} size={28} />
            <Text color="label" size="20pt" weight="bold">
              {competition.name}
            </Text>
          </Box>
          {event && <EventVolume volume={event.volume} />}
        </Box>
      ) : (
        event && <EventHeaderSection event={event} />
      )}
      <GameBoxScore gameId={gameId} />
    </>
  );
}

function EventVolume({ volume }: { volume: number }) {
  return (
    <Text color="labelQuaternary" size="15pt" weight="bold">
      {`${formatNumber(String(volume), { useOrderSuffix: true, decimals: 1, style: '$' })} ${i18n.t(i18n.l.market_data.vol)}`}
    </Text>
  );
}

function SportsEventLookup({ eventId }: { eventId: string }) {
  const isFocused = useIsFocused();
  const eventIds = useMemo(() => [eventId], [eventId]);
  useSportsLookup(eventIds, Routes.POLYMARKET_EVENT_SCREEN, isFocused, eventIds);
  return null;
}

const ChartSection = memo(function ChartSection({
  event,
  backgroundColor,
}: {
  event: PolymarketEvent | PolymarketMarketEvent;
  backgroundColor: string;
}) {
  const { isDarkMode } = useColorMode();
  const lineColors = useMemo(() => ('markets' in event ? getChartLineColors(event.markets) : undefined), [event]);
  const activeInteraction = useSharedValue<ActiveInteractionData | undefined>(undefined);
  const isChartGestureActive = useSharedValue(false);

  return (
    <Box gap={16}>
      <PolymarketChartHeader
        activeInteraction={activeInteraction}
        backgroundColor={backgroundColor}
        colors={lineColors}
        isChartGestureActive={isChartGestureActive}
        isSportsEvent={false}
      />
      <Bleed horizontal="24px">
        <Box borderRadius={16} gap={8} overflow="hidden" width={DEVICE_WIDTH}>
          <PolymarketChart
            activeInteraction={activeInteraction}
            backgroundColor={backgroundColor}
            config={lineColors ? { line: { colors: lineColors, overrideSeriesColors: true } } : undefined}
            isChartGestureActive={isChartGestureActive}
          />
          <PolymarketTimeframeSelector
            backgroundColor={backgroundColor}
            color={isDarkMode ? globalColors.white100 : globalColors.grey100}
          />
        </Box>
      </Bleed>
    </Box>
  );
});

// ============ Sheet ========================================================== //

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

function EventSheet({ backgroundColor: screenBackgroundColor, children }: { backgroundColor: string; children: ReactNode }) {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <SlackSheet
        backgroundColor={screenBackgroundColor}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(Platform.OS === 'ios' ? { height: '100%' } : {})}
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
          {children}
        </Box>
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={screenBackgroundColor} height={safeAreaInsets.top + (Platform.OS === 'android' ? 24 : 12)} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={screenBackgroundColor}
          startColor={screenBackgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
    </>
  );
}
