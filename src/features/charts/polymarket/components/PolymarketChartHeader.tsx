import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { type DerivedValue, type SharedValue, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { easing, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { AnimatedText, Text, TextShadow, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { type StoreState } from '@/state/internal/queryStore/types';
import { type BaseRainbowStore } from '@/state/internal/types';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { type ResponseByTheme, getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/framework/ui/utils/opacity';
import { type FormatTimestampOptions, formatTimestamp } from '@/worklets/dates';
import { type ActiveInteractionData } from '../classes/PolymarketChartManager';
import { usePolymarketChartStore, usePolymarketMarketChartStore } from '../stores/polymarketChartStore';
import { type OutcomeSeries, type PolymarketChartData, type SeriesPaletteColors } from '../types';

// ============ Constants ====================================================== //

const BUBBLE = Object.freeze({ borderOpacity: 0.06, borderWidth: 2, height: 30, opacity: 0.12, paddingHorizontal: 10 });
const LEGEND = Object.freeze({ dotSize: 6, itemHeight: 18 });

const BACKGROUND_GRADIENT_HEIGHT = 88;
const GAP_BETWEEN_BUBBLES = 6;
const GAP_BETWEEN_LEGEND_ITEMS = 16;
const GAP_PRICE_TO_LABEL = 6;
const GAP_VERTICAL = 6;
const SCREEN_PADDING_HORIZONTAL = 24;

const EMPTY_ENTRIES: LegendEntry[] = [];
const EMPTY_SERIES: OutcomeSeries[] = [];
const TIME_FORMAT_OPTIONS: FormatTimestampOptions = Object.freeze({ useTodayYesterday: true });

// ============ Types ========================================================== //

type ChartsStoreType = BaseRainbowStore<{
  getData: () => PolymarketChartData;
  getStatus: StoreState<unknown, Record<string, unknown>>['getStatus'];
}>;

type LegendEntry = {
  color: ResponseByTheme<string>;
  label: string;
  price: number;
  tokenId: string;
};

type PolymarketChartHeaderProps = {
  activeInteraction: SharedValue<ActiveInteractionData | undefined>;
  backgroundColor: string;
  colors: SeriesPaletteColors | undefined;
  isChartGestureActive: SharedValue<boolean>;
  isMarketChart?: boolean;
  isSportsEvent: boolean;
};

// ============ PolymarketChartHeader ========================================== //

export const PolymarketChartHeader = memo(function PolymarketChartHeader({
  activeInteraction,
  backgroundColor,
  colors,
  isChartGestureActive,
  isMarketChart = false,
  isSportsEvent,
}: PolymarketChartHeaderProps) {
  const { isDarkMode } = useColorMode();
  const chartsStore: ChartsStoreType = isMarketChart ? usePolymarketMarketChartStore : usePolymarketChartStore;
  const series = chartsStore(state => state.getData()?.series ?? EMPTY_SERIES, areSeriesEqual);
  const isInitialLoad = chartsStore(state => state.getStatus('isInitialLoad')) && series === EMPTY_SERIES;

  const legendEntries = useMemo(() => buildLegendEntries(series, colors), [series, colors]);
  const hasData = Boolean(legendEntries.length);
  const shouldHideLegend = isSportsEvent || (!isInitialLoad && (!hasData || legendEntries.length === 1));

  const interactionStyle = useAnimatedStyle(() => {
    const shouldDisplay = _WORKLET && isChartGestureActive.value;
    const timingConfig = TIMING_CONFIGS[shouldDisplay ? 'buttonPressConfig' : 'buttonPressConfig'];
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, timingConfig),
      transform: [{ scale: withTiming(shouldDisplay ? 1 : 1.02, timingConfig) }],
      pointerEvents: shouldDisplay ? 'auto' : 'none',
    };
  });

  const legendStyle = useAnimatedStyle(() => {
    const shouldDisplay = hasData && (!_WORKLET || !isChartGestureActive.value);
    const timingConfig = TIMING_CONFIGS[shouldDisplay ? 'buttonPressConfig' : 'buttonPressConfig'];
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, timingConfig),
      transform: [{ scale: withTiming(shouldDisplay ? 1 : hasData ? 0.94 : 1, timingConfig) }],
      zIndex: shouldDisplay ? 0 : -1,
    };
  });

  return (
    <View style={[shouldHideLegend ? styles.sportsEventContainer : styles.container]}>
      {shouldHideLegend ? null : (
        <Animated.View style={[styles.cover, legendStyle]}>
          <LegendContent backgroundColor={backgroundColor} entries={legendEntries} isDarkMode={isDarkMode} />
        </Animated.View>
      )}

      <Animated.View style={[styles.cover, styles.interactionLayer, interactionStyle]}>
        <InteractionContent
          activeInteraction={activeInteraction}
          backgroundColor={backgroundColor}
          isDarkMode={isDarkMode}
          legendEntries={legendEntries}
        />
      </Animated.View>
    </View>
  );
});

// ============ LegendContent ================================================== //

const LegendContent = memo(function LegendContent({
  backgroundColor,
  entries,
  isDarkMode,
}: {
  backgroundColor: string;
  entries: LegendEntry[];
  isDarkMode: boolean;
}) {
  return (
    <View style={styles.legendContainer}>
      <Animated.ScrollView
        contentContainerStyle={styles.contentContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.legendRow}>
          {entries.map(entry => (
            <LegendItem color={entry.color} isDarkMode={isDarkMode} key={entry.tokenId} label={entry.label} />
          ))}
        </View>
      </Animated.ScrollView>

      <EasingGradient
        easing={easing.in.sin}
        endColor={backgroundColor}
        endPosition="left"
        startColor={backgroundColor}
        startPosition="right"
        steps={8}
        style={styles.leftFade}
      />

      <EasingGradient
        easing={easing.in.sin}
        endColor={backgroundColor}
        endPosition="right"
        startColor={backgroundColor}
        startPosition="left"
        steps={8}
        style={styles.rightFade}
      />
    </View>
  );
});

const LegendItem = memo(function LegendItem({
  color,
  isDarkMode,
  label,
}: {
  color: ResponseByTheme<string>;
  isDarkMode: boolean;
  label: string;
}) {
  const dotStyle = useMemo(
    () => [
      styles.legendDot,
      { backgroundColor: getColorValueForThemeWorklet(color, isDarkMode) },
      IS_IOS && isDarkMode && { shadowColor: getColorValueForThemeWorklet(color, isDarkMode) },
    ],
    [color, isDarkMode]
  );

  return (
    <View style={styles.legendItem}>
      <View style={dotStyle} />
      <Text color="labelQuaternary" numberOfLines={1} size="13pt" weight="bold">
        {label}
      </Text>
    </View>
  );
});

// ============ InteractionContent ============================================= //

const InteractionContent = memo(function InteractionContent({
  activeInteraction,
  backgroundColor,
  isDarkMode,
  legendEntries,
}: {
  activeInteraction: SharedValue<ActiveInteractionData | undefined>;
  backgroundColor: string;
  isDarkMode: boolean;
  legendEntries: LegendEntry[];
}) {
  const timestampText = useDerivedValue(() => {
    const data = activeInteraction.value;
    if (!data) return '';
    return formatTimestamp(data.timestamp, TIME_FORMAT_OPTIONS);
  });

  return (
    <View style={styles.interactionRow}>
      <View style={[styles.backgroundColorLayer, { backgroundColor }]} />
      <EasingGradient
        endColor={backgroundColor}
        endOpacity={1}
        startColor={opacity(backgroundColor, 0)}
        startOpacity={0}
        style={styles.backgroundGradient}
      />

      <View style={styles.timestampWrapper}>
        <AnimatedText color="label" numberOfLines={1} size="20pt" style={styles.timestampText} tabularNumbers weight="heavy">
          {timestampText}
        </AnimatedText>
      </View>

      <View style={styles.outcomesRow}>
        {legendEntries.map(entry => (
          <OutcomeBubble
            activeInteraction={activeInteraction}
            backgroundColor={backgroundColor}
            isDarkMode={isDarkMode}
            key={entry.tokenId}
            legendEntry={entry}
            tokenId={entry.tokenId}
          />
        ))}
      </View>
    </View>
  );
});

// ============ OutcomeBubble ================================================== //

const OutcomeBubble = memo(function OutcomeBubble({
  activeInteraction,
  backgroundColor,
  isDarkMode,
  legendEntry,
  tokenId,
}: {
  activeInteraction: SharedValue<ActiveInteractionData | undefined>;
  backgroundColor: string;
  isDarkMode: boolean;
  legendEntry: LegendEntry;
  tokenId: string;
}) {
  const outcomeColor = useDerivedValue((): string => {
    const data = activeInteraction.value;
    const outcome = data?.outcomes.find(o => o.tokenId === tokenId);
    return withTiming(getColorValueForThemeWorklet(outcome?.color ?? legendEntry.color, isDarkMode), TIMING_CONFIGS.fastFadeConfig);
  });

  const priceText = useDerivedValue(() => {
    const data = activeInteraction.value;
    if (!data) return '';
    const outcome = data.outcomes.find(o => o.tokenId === tokenId);
    if (!outcome) return '';
    return formatPercent(outcome.price);
  });

  const bubbleBackgroundStyle = useAnimatedStyle(() => {
    const color = outcomeColor.value;
    const backgroundColor = opacity(color, BUBBLE.opacity);
    const borderColor = opacity(color, BUBBLE.borderOpacity);
    return { backgroundColor, borderColor };
  });

  const priceTextStyle = useAnimatedStyle(() => ({
    color: outcomeColor.value,
    textShadowColor: isDarkMode ? opacity(outcomeColor.value, 0.24) : 'transparent',
  }));

  return (
    <View style={styles.bubbleContainer}>
      <Animated.View
        style={[
          styles.bubbleBackground,
          bubbleBackgroundStyle,
          { borderWidth: IS_IOS ? (isDarkMode ? BUBBLE.borderWidth : THICKER_BORDER_WIDTH) : 0 },
        ]}
      />
      <LinearGradient
        colors={[opacity(backgroundColor, 0), backgroundColor]}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.gradientOverlay}
      />
      <OutcomePrice isDarkMode={isDarkMode} priceText={priceText} textStyle={priceTextStyle} />
      <Text align="center" color="labelSecondary" numberOfLines={1} size="13pt" weight="bold">
        {legendEntry.label}
      </Text>
    </View>
  );
});

// ============ OutcomePrice =================================================== //

const OutcomePrice = memo(function OutcomePrice({
  isDarkMode,
  priceText,
  textStyle,
}: {
  isDarkMode: boolean;
  priceText: DerivedValue<string>;
  textStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <TextShadow blur={12} shadowOpacity={isDarkMode ? 0.24 : 0}>
      <AnimatedText align="center" size="13pt" style={textStyle} tabularNumbers weight="heavy">
        {priceText}
      </AnimatedText>
    </TextShadow>
  );
});

// ============ Utilities ====================================================== //

/**
 * Prevents data loss when switching chart timeframes.
 */
function areSeriesEqual(prev: OutcomeSeries[], next: OutcomeSeries[]): boolean {
  return (next.length === 0 && prev.length > 0) || prev === next;
}

function buildLegendEntries(series: OutcomeSeries[] | undefined, colors: SeriesPaletteColors | undefined): LegendEntry[] {
  if (!series?.length || series.length === 1) return EMPTY_ENTRIES;

  const entries: LegendEntry[] = series.map((s, index) => ({
    color: colors?.[index] ?? s.color,
    label: s.label,
    price: s.prices.length > 0 ? s.prices[s.prices.length - 1] : 0,
    tokenId: s.tokenId,
  }));

  entries.sort((a, b) => b.price - a.price);

  return entries;
}

function formatPercent(value: number): string {
  'worklet';
  return `${Math.round(value * 100)}%`;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  backgroundColorLayer: {
    bottom: 0,
    height: '100%',
    left: 0,
    minHeight: BUBBLE.height + BACKGROUND_GRADIENT_HEIGHT,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backgroundGradient: {
    height: BACKGROUND_GRADIENT_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: -BACKGROUND_GRADIENT_HEIGHT,
  },
  bubbleBackground: {
    borderCurve: 'continuous',
    borderRadius: BUBBLE.height / 2,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bubbleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: GAP_PRICE_TO_LABEL,
    height: BUBBLE.height,
    paddingHorizontal: BUBBLE.paddingHorizontal,
  },
  container: {
    height: BUBBLE.height,
    marginVertical: -(BUBBLE.height - LEGEND.itemHeight) / 2,
    overflow: 'visible',
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: GAP_BETWEEN_LEGEND_ITEMS,
    justifyContent: 'center',
    paddingVertical: (BUBBLE.height - LEGEND.itemHeight) / 2,
  },
  cover: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  gradientOverlay: {
    bottom: -BUBBLE.borderWidth,
    left: -BUBBLE.borderWidth,
    position: 'absolute',
    right: -BUBBLE.borderWidth,
    top: -BUBBLE.borderWidth,
  },
  interactionLayer: {
    justifyContent: 'flex-end',
  },
  interactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP_BETWEEN_BUBBLES,
    marginHorizontal: -8,
  },
  leftFade: {
    height: '100%',
    left: -SCREEN_PADDING_HORIZONTAL,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: SCREEN_PADDING_HORIZONTAL,
  },
  legendContainer: {
    overflow: 'visible',
  },
  legendDot: {
    borderRadius: LEGEND.dotSize / 2,
    height: LEGEND.dotSize,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 7.5,
    width: LEGEND.dotSize,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: BUBBLE.height,
    justifyContent: 'center',
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: GAP_BETWEEN_LEGEND_ITEMS,
    height: BUBBLE.height,
    justifyContent: 'center',
  },
  outcomesRow: {
    bottom: 0,
    columnGap: GAP_BETWEEN_BUBBLES,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: GAP_VERTICAL,
    width: '100%',
  },
  rightFade: {
    height: '100%',
    pointerEvents: 'none',
    position: 'absolute',
    right: -SCREEN_PADDING_HORIZONTAL,
    top: 0,
    width: SCREEN_PADDING_HORIZONTAL,
  },
  scrollView: {
    flexGrow: 0,
    marginVertical: -(BUBBLE.height - LEGEND.itemHeight) / 2,
    overflow: 'visible',
  },
  sportsEventContainer: {
    position: 'absolute',
    top: -10,
    width: '100%',
  },
  timestampText: {
    width: '100%',
  },
  timestampWrapper: {
    alignItems: 'center',
    height: BUBBLE.height,
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: '100%',
  },
});
