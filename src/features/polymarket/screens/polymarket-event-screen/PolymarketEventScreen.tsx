import React, { memo, useCallback, useEffect } from 'react';
import { Box, Separator, Text, useColorMode } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Chart } from '@/components/value-chart/Chart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OpenPositionsSection } from '@/features/polymarket/screens/polymarket-event-screen/OpenPositionsSection';
import SlackSheet from '@/components/sheet/SlackSheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { MarketSortOrder, usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import ImgixImage from '@/components/images/ImgixImage';
import { MarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/MarketsSection';
import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { PriceHistoryInterval } from '@polymarket/clob-client';
import { time } from '@/utils/time';
import { formatNumber } from '@/helpers/strings';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { AboutSection } from '@/features/polymarket/screens/polymarket-event-screen/AboutSection';
import { SportsEventMarkets } from '@/features/polymarket/screens/polymarket-event-screen/SportsEventMarkets';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { GameBoxScore } from '@/features/polymarket/screens/polymarket-event-screen/components/GameBoxScore';

export const EventHeaderSection = memo(function EventHeaderSection({
  initialEvent,
}: {
  initialEvent: PolymarketMarketEvent | PolymarketEvent;
}) {
  const event = usePolymarketEventStore(state => state.getData() ?? initialEvent);
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
        <ImgixImage resizeMode="cover" size={64} source={{ uri: event.icon }} style={{ height: 64, width: 64, borderRadius: 9 }} />
      </Box>
    </Box>
  );
});

export const ChartSection = memo(function ChartSection() {
  const markets = usePolymarketEventStore(state => state.getMarkets(MarketSortOrder.VOLUME));
  const topMarkets = markets?.slice(0, 5);
  // The first token id in the array always represents the "Yes" outcome
  const topMarketsTokenIds = topMarkets?.map(market => market.clobTokenIds[0]);

  // Example usage:
  const fetchPricesHistory = useCallback(async () => {
    if (!topMarketsTokenIds) return;
    const startTs = Math.floor((Date.now() - time.days(7)) / 1000);
    const endTs = Math.floor(Date.now() / 1000);

    const pricesHistories = await Promise.all(
      topMarketsTokenIds.map(tokenId =>
        polymarketClobDataClient.getPricesHistory({
          market: tokenId,
          startTs,
          endTs,
          fidelity: 1,
          interval: PriceHistoryInterval.ONE_DAY,
        })
      )
    );
  }, [topMarketsTokenIds]);

  return (
    <Box
      height={350}
      justifyContent="center"
      alignItems="center"
      backgroundColor="backgroundSecondary"
      borderRadius={12}
      borderWidth={1}
      borderColor="separator"
    >
      <Text color="label" size="15pt" weight="bold">
        Chart
      </Text>
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
  const backgroundColor = isDarkMode
    ? getSolidColorEquivalent({ background: initialEvent.color, foreground: '#000000', opacity: 0.92 })
    : '#FFFFFF';
  const safeAreaInsets = useSafeAreaInsets();
  const isSportsEvent = initialEvent.gameId !== undefined;

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
          <EventHeaderSection initialEvent={initialEvent} />
          {isSportsEvent && <GameBoxScore />}
          <ChartSection />
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
