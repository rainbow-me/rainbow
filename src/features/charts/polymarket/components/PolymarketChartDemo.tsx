import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, globalColors, Inline, Text, useColorMode } from '@/design-system';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { LineSmoothing } from '../../line/LineSmoothingAlgorithms';
import { polymarketChartsActions, usePolymarketStore } from '../stores/polymarketStore';
import { PolymarketChart } from './PolymarketChart';
import { PolymarketTimeframeSelector } from './PolymarketTimeframeSelector';
import { fetchGammaEvent } from '../api/gammaClient';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { POLYMARKET_BACKGROUND_DARK, PolymarketOutcome } from '@/features/polymarket/constants';
import { GammaEvent } from '../types';
import { PolymarketMarket, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { useOnChange } from '@/hooks/useOnChange';
import { useListen } from '@/state/internal/hooks/useListen';
import { usePolymarketChartStore } from '@/features/charts/polymarket/stores/polymarketChartStore';

// ============ Constants ====================================================== //

const CHART_HEIGHT = 300;

// const SMOOTHING_OPTIONS: { label: string; value: LineSmoothing }[] = Object.entries(LineSmoothing).map(([key, value]) => ({
//   label: key,
//   value: value,
// }));

const DEMO_MARKETS = [
  { name: 'Fed Decision', slug: 'fed-decision-in-december' },
  { name: 'Premier League Winner', slug: 'english-premier-league-winner' },
  { name: '2028 President', slug: 'presidential-election-winner-2028' },
  { name: '2028 Dem Nominee', slug: 'democratic-presidential-nominee-2028' },
  { name: 'Ukraine Ceasefire 2025', slug: 'russia-x-ukraine-ceasefire-in-2025' },
  { name: 'Maduro Out 2025', slug: 'maduro-out-in-2025' },
  { name: 'Chile President', slug: 'chile-presidential-election' },
] as const;

// ============ Component ====================================================== //

export const PolymarketChartDemo = memo(function PolymarketChartDemo() {
  const { isDarkMode } = useColorMode();
  const [refreshKey, setRefreshKey] = useState(0);
  // const selectedEventSlug = usePolymarketStore(state => state.selectedEventSlug);
  // const [selectedMarket, setSelectedMarket] = useState<(typeof DEMO_MARKETS)[number]>(DEMO_MARKETS[0]);
  // const [selectedSmoothing, setSelectedSmoothing] = useState(LineSmoothing.Makima);
  const eventDataRef = useRef<GammaEvent | null>(null);
  // const [isLoadingEvent, setIsLoadingEvent] = useState(false);

  // const chartData = usePolymarketChartStore(state => state.getData());
  // const highlightedSeriesId = usePolymarketStore(state => state.highlightedSeriesId);

  // const seriesTokenIds = useMemo(() => chartData?.series.map(s => s.tokenId) ?? [], [chartData?.series]);

  // const currentHighlightLabel = useMemo(() => {
  //   if (!highlightedSeriesId) return 'None';
  //   const series = chartData?.series.find(s => s.tokenId === highlightedSeriesId);
  //   return series?.label ?? 'Unknown';
  // }, [chartData?.series, highlightedSeriesId]);

  useLayoutEffect(() => {
    polymarketChartsActions.setSelectedEventSlug(DEMO_MARKETS[0].slug);
  }, []);

  const shouldResetRef = useRef(false);

  const fetchEventData = useCallback(() => {
    eventDataRef.current = null;
    const selectedEventSlug = usePolymarketStore.getState().selectedEventSlug;
    if (!selectedEventSlug) return;
    fetchGammaEvent(null, selectedEventSlug)
      .then(event => {
        eventDataRef.current = event;
      })
      .catch(() => {
        return;
      });
  }, []);

  const handleMarketSelect = useCallback((market: (typeof DEMO_MARKETS)[number]) => {
    const currentEventSlug = usePolymarketStore.getState().selectedEventSlug;
    if (currentEventSlug === market.slug) return;
    shouldResetRef.current = true;
    polymarketChartsActions.setSelectedEventSlug(market.slug);
    // setRefreshKey(prev => prev + 1);
    // fetchEventData();
  }, []);

  // const handleSmoothingSelect = useCallback((smoothing: LineSmoothing) => {
  //   setSelectedSmoothing(smoothing);
  //   setRefreshKey(prev => prev + 1);
  // }, []);

  useListen(
    usePolymarketChartStore,
    state => state.getData(),
    data => {
      if (!data || !shouldResetRef.current) return;
      // queueMicrotask(() => {
      shouldResetRef.current = false;
      setRefreshKey(prev => prev + 1);
      fetchEventData();
      // });
    }
  );

  // ============ Navigation Handlers ============================================ //

  const handleOpenEventScreen = useCallback(() => {
    const eventData = eventDataRef.current;
    if (!eventData) return;
    Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, {
      eventId: eventData.id,
      event: {
        id: eventData.id,
        slug: eventData.slug,
        title: eventData.title,
        description: eventData.description,
        closed: eventData.closed,
        negRisk: eventData.negRisk,
      } as PolymarketMarketEvent,
    });
  }, [eventDataRef]);

  const handleOpenMarketSheet = useCallback(() => {
    const eventData = eventDataRef.current;
    if (!eventData?.markets?.[0]) return;
    const market = eventData.markets[0];
    Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market: market as PolymarketMarket });
  }, [eventDataRef]);

  const handleOpenNewPositionSheet = useCallback(
    (outcome: typeof PolymarketOutcome.YES | typeof PolymarketOutcome.NO) => {
      const eventData = eventDataRef.current;
      if (!eventData?.markets?.[0]) return;
      const market = eventData.markets[0];
      Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market: market as PolymarketMarket, outcome });
    },
    [eventDataRef]
  );

  const handleOpenBrowseEvents = useCallback(() => {
    Navigation.handleAction(Routes.POLYMARKET_BROWSE_EVENTS_SCREEN);
  }, []);

  const handleOpenAccountScreen = useCallback(() => {
    Navigation.handleAction(Routes.POLYMARKET_ACCOUNT_SCREEN);
  }, []);

  // const handleCycleHighlight = useCallback(() => {
  //   if (!seriesTokenIds.length) return;

  //   const currentIndex = highlightedSeriesId ? seriesTokenIds.indexOf(highlightedSeriesId) : -1;
  //   const nextIndex = currentIndex + 1;

  //   if (nextIndex >= seriesTokenIds.length) {
  //     // Cycle back to "none"
  //     polymarketChartsActions.setHighlightedSeriesId(null);
  //   } else {
  //     polymarketChartsActions.setHighlightedSeriesId(seriesTokenIds[nextIndex]);
  //   }
  // }, [highlightedSeriesId, seriesTokenIds]);

  return (
    <View style={[styles.container, isDarkMode ? styles.containerDark : styles.containerLight]}>
      <Box paddingHorizontal="16px" paddingVertical="12px">
        <Inline>
          <ButtonPressAnimation onPress={() => setRefreshKey(prev => prev + 1)} scaleTo={0.975}>
            <Text color="label" size="17pt" weight="heavy">
              Polymarket Chart Demo
            </Text>
          </ButtonPressAnimation>
        </Inline>
      </Box>

      <ScrollView
        contentContainerStyle={styles.marketSelectorContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.marketSelector}
      >
        <DemoMarkets handleMarketSelect={handleMarketSelect} isDarkMode={isDarkMode} />
      </ScrollView>

      <PolymarketChart
        chartHeight={CHART_HEIGHT}
        chartWidth={DEVICE_WIDTH}
        key={refreshKey}
        // key={`${selectedEventSlug}:${refreshKey}`}
        smoothingMode={LineSmoothing.Makima}
      />

      <PolymarketTimeframeSelector backgroundColor={isDarkMode ? '#050B14' : '#F5F5F7'} color={globalColors.white100} />

      {/* Navigation Debug Buttons */}
      <Box paddingHorizontal="16px" paddingTop="16px" gap={8}>
        <View style={styles.debugButtonRow}>
          <ButtonPressAnimation
            onPress={handleOpenEventScreen}
            scaleTo={0.96}
            style={[styles.debugButton, isDarkMode ? styles.debugButtonDark : styles.debugButtonLight]}
          >
            <Text color="label" size="13pt" weight="heavy">
              Event Screen
            </Text>
          </ButtonPressAnimation>

          <ButtonPressAnimation
            onPress={handleOpenMarketSheet}
            scaleTo={0.96}
            style={[styles.debugButton, isDarkMode ? styles.debugButtonDark : styles.debugButtonLight]}
          >
            <Text color="label" size="13pt" weight="heavy">
              Market Sheet
            </Text>
          </ButtonPressAnimation>
        </View>

        <View style={styles.debugButtonRow}>
          <ButtonPressAnimation
            onPress={handleOpenBrowseEvents}
            scaleTo={0.96}
            style={[styles.debugButton, isDarkMode ? styles.debugButtonDark : styles.debugButtonLight]}
          >
            <Text color="label" size="13pt" weight="heavy">
              Browse Events
            </Text>
          </ButtonPressAnimation>

          <ButtonPressAnimation
            onPress={handleOpenAccountScreen}
            scaleTo={0.96}
            style={[styles.debugButton, isDarkMode ? styles.debugButtonDark : styles.debugButtonLight]}
          >
            <Text color="label" size="13pt" weight="heavy">
              Account Screen
            </Text>
          </ButtonPressAnimation>
        </View>

        <View style={styles.debugButtonRow}>
          <ButtonPressAnimation
            onPress={() => handleOpenNewPositionSheet(PolymarketOutcome.YES)}
            scaleTo={0.96}
            style={[
              styles.debugButton,
              isDarkMode ? styles.debugButtonDark : styles.debugButtonLight,
              { backgroundColor: 'rgba(52, 199, 89, 0.2)' },
            ]}
          >
            <Text color="green" size="13pt" weight="heavy">
              Buy YES
            </Text>
          </ButtonPressAnimation>

          <ButtonPressAnimation
            onPress={() => handleOpenNewPositionSheet(PolymarketOutcome.NO)}
            scaleTo={0.96}
            style={[
              styles.debugButton,
              isDarkMode ? styles.debugButtonDark : styles.debugButtonLight,
              { backgroundColor: 'rgba(255, 59, 48, 0.2)' },
            ]}
          >
            <Text color="red" size="13pt" weight="heavy">
              Buy NO
            </Text>
          </ButtonPressAnimation>
        </View>
      </Box>

      {/* <View style={styles.highlightRow}>
        <ButtonPressAnimation
          disabled={!seriesTokenIds.length}
          onPress={handleCycleHighlight}
          scaleTo={0.96}
          style={[styles.highlightButton, isDarkMode ? styles.highlightButtonDark : styles.highlightButtonLight]}
        >
          <Text color="label" size="13pt" weight="bold">
            Highlight: {currentHighlightLabel}
          </Text>
        </ButtonPressAnimation>
      </View> */}

      {/* <View style={styles.smoothingGrid}>
        {SMOOTHING_OPTIONS.map(option => {
          const isSelected = option.value === selectedSmoothing;
          return (
            <ButtonPressAnimation
              key={option.value}
              // onPress={() => handleSmoothingSelect(option.value)}
              onPress={() => handleSmoothingSelect(LineSmoothing.Makima)}
              scaleTo={0.94}
              style={[
                styles.smoothingButton,
                isSelected && (isDarkMode ? styles.smoothingButtonSelectedDark : styles.smoothingButtonSelectedLight),
              ]}
            >
              <Text align="center" color={isSelected ? 'label' : 'labelQuaternary'} size="15pt" weight="bold">
                {option.label}
              </Text>
            </ButtonPressAnimation>
          );
        })}
      </View> */}
    </View>
  );
});

const DemoMarkets = ({
  handleMarketSelect,
  isDarkMode,
}: {
  handleMarketSelect: (market: (typeof DEMO_MARKETS)[number]) => void;
  isDarkMode: boolean;
}) => {
  const selectedEventSlug = usePolymarketStore(state => state.selectedEventSlug);
  return DEMO_MARKETS.map(market => {
    const isSelected = market.slug === selectedEventSlug;
    return (
      <Pressable
        key={market.slug}
        onPress={() => handleMarketSelect(market)}
        style={[styles.marketChip, isSelected && (isDarkMode ? styles.marketChipSelectedDark : styles.marketChipSelectedLight)]}
      >
        <Text color={isSelected ? 'label' : 'labelSecondary'} size="13pt" weight={isSelected ? 'heavy' : 'bold'}>
          {market.name}
        </Text>
      </Pressable>
    );
  });
};

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    gap: 8,
    marginTop: 20,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  containerDark: {
    // backgroundColor: '#141619',
    backgroundColor: POLYMARKET_BACKGROUND_DARK,
  },
  containerLight: {
    backgroundColor: '#F5F5F7',
  },
  debugButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    flex: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  debugButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  debugButtonDisabled: {
    opacity: 0.4,
  },
  debugButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  debugButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  highlightButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  highlightButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  highlightButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  highlightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  marketChip: {
    alignItems: 'center',
    borderRadius: 20,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  marketChipSelectedDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  marketChipSelectedLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  marketSelector: {
    marginBottom: 8,
  },
  marketSelectorContent: {
    gap: 4,
    paddingHorizontal: 12,
  },
  smoothingButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 34,
    justifyContent: 'center',
    width: '31%',
  },
  smoothingButtonSelectedDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  smoothingButtonSelectedLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  smoothingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    opacity: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
