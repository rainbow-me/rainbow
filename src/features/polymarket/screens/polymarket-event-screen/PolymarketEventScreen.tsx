import React, { memo, useMemo } from 'react';
import { Bleed, Box, globalColors, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
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
import * as i18n from '@/languages';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { PolymarketChart } from '@/features/charts/polymarket/components/PolymarketChart';
import { PolymarketTimeframeSelector } from '@/features/charts/polymarket/components/PolymarketTimeframeSelector';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { SportsEventMarkets } from '@/features/polymarket/screens/polymarket-event-screen/SportsEventMarkets';
import { getChartLineColors } from '@/features/charts/polymarket/utils/getChartLineColors';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { AboutSection } from '@/features/polymarket/screens/polymarket-event-screen/AboutSection';
import { GameBoxScore } from '@/features/polymarket/screens/polymarket-event-screen/components/GameBoxScore';
import { MoneylineOddsRatioBar } from '@/features/polymarket/screens/polymarket-event-screen/components/MoneylineOddsRatioBar';
import { ResolvedEventHeader } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedEventHeader';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { ActiveInteractionData } from '@/features/charts/polymarket/classes/PolymarketChartManager';
import { useSharedValue } from 'react-native-reanimated';
import { PolymarketChartHeader } from '@/features/charts/polymarket/components/PolymarketChartHeader';
import { SeriesPaletteColors } from '@/features/charts/polymarket/types';
import { getLeague } from '@/features/polymarket/utils/sports';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';

export const EventHeaderSection = memo(function EventHeaderSection({ event }: { event: PolymarketMarketEvent | PolymarketEvent }) {
  const labelQuaternary = useForegroundColor('labelQuaternary');

  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-start" gap={16}>
        <Box gap={20} style={{ flex: 1 }}>
          <Text color={'label'} size="30pt" weight="heavy" align="left">
            {event.title}
          </Text>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text color={'labelQuaternary'} size="15pt" weight="bold">
              {`${formatNumber(String(event.volume), { useOrderSuffix: true, decimals: 1, style: '$' })} ${i18n.t(i18n.l.market_data.vol)}`}
            </Text>
            {event.startTime && event.gameId && !event.closed && !event.live && (
              <>
                <Box height={3} width={3} backgroundColor={labelQuaternary} borderRadius={1.5} />
                <Text color={'labelQuaternary'} size="15pt" weight="bold">
                  {formatTimestamp(toUnixTime(event.startTime))}
                </Text>
              </>
            )}
          </Box>
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

const SportsGameHeaderSection = memo(function SportsGameHeaderSection({ event }: { event: PolymarketMarketEvent | PolymarketEvent }) {
  const { isDarkMode } = useColorMode();
  const league = getLeague(event.slug);
  const leagueColor = getColorValueForThemeWorklet(league?.color, isDarkMode);
  return (
    <Box>
      {league ? (
        <Box flexDirection="row" alignItems="center" gap={8}>
          <LeagueIcon eventSlug={event.slug} />
          <Text color={{ custom: leagueColor }} size="20pt" weight="bold" align="left">
            {league.name}
          </Text>
        </Box>
      ) : (
        <Text color={'label'} size="20pt" weight="bold" align="left">
          {event.title}
        </Text>
      )}
    </Box>
  );
});

const ChartSection = memo(function ChartSection({
  backgroundColor,
  isSportsEvent,
  lineColors,
}: {
  backgroundColor: string;
  isSportsEvent: boolean;
  lineColors: SeriesPaletteColors | undefined;
}) {
  const { isDarkMode } = useColorMode();
  const activeInteraction = useSharedValue<ActiveInteractionData | undefined>(undefined);
  const isChartGestureActive = useSharedValue(false);
  return (
    <Box gap={16}>
      <PolymarketChartHeader
        activeInteraction={activeInteraction}
        backgroundColor={backgroundColor}
        colors={lineColors}
        isChartGestureActive={isChartGestureActive}
        isSportsEvent={isSportsEvent}
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

  const eventColor = useMemo(() => getColorValueForThemeWorklet(event.color, isDarkMode), [event.color, isDarkMode]);
  const screenBackgroundColor = isDarkMode
    ? getSolidColorEquivalent({ background: eventColor, foreground: '#000000', opacity: 0.92 })
    : POLYMARKET_BACKGROUND_LIGHT;

  const isSportsGameEvent = event.gameId !== undefined;
  const lineColors = useMemo(() => parseLineColors(event, isSportsGameEvent), [event, isSportsGameEvent]);
  const isEventResolved = event.closed;
  const shouldShowChart = !isEventResolved && !isSportsGameEvent;

  return (
    <>
      <SlackSheet
        backgroundColor={screenBackgroundColor}
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
          {isSportsGameEvent ? <SportsGameHeaderSection event={event} /> : <EventHeaderSection event={event} />}
          {isSportsGameEvent && (
            <Box gap={24}>
              <GameBoxScore event={event} />
              <MoneylineOddsRatioBar event={event} />
            </Box>
          )}
          {shouldShowChart && (
            <ChartSection backgroundColor={screenBackgroundColor} isSportsEvent={isSportsGameEvent} lineColors={lineColors} />
          )}
          <OpenPositionsSection eventId={eventId} eventColor={eventColor} />
          {isSportsGameEvent ? <SportsEventMarkets /> : <MarketsSection event={eventData} />}
          <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
          <AboutSection event={event} screenBackgroundColor={screenBackgroundColor} />
        </Box>
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={screenBackgroundColor} height={safeAreaInsets.top + (IS_ANDROID ? 24 : 12)} width="full">
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
});

function parseLineColors(event: PolymarketEvent | PolymarketMarketEvent, isSportsEvent: boolean): SeriesPaletteColors | undefined {
  if (isSportsEvent) return undefined;
  if (!('markets' in event)) return undefined;
  return getChartLineColors(event.markets);
}
