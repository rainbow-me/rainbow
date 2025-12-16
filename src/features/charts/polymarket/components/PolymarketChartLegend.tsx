import React, { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS, easing } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Text, TextShadow } from '@/design-system';
import { IS_IOS } from '@/env';
import { usePolymarketChartStore } from '../stores/polymarketChartStore';
import { OutcomeSeries } from '../types';

// ============ Constants ====================================================== //

const DOT_SIZE = 6;
const EDGE_FADE_WIDTH = 24;
const ITEM_HEIGHT = 18;
const SCREEN_PADDING = 24;

const DOT = Object.freeze({ borderRadius: DOT_SIZE / 2, shadowOpacity: 0.4, shadowRadius: 7.5, size: DOT_SIZE });
const LAYOUT = Object.freeze({ gapBetweenItems: 16, gapDotToLabel: 6, paddingHorizontal: 0, paddingVertical: 8 });

const EMPTY_ENTRIES: LegendEntry[] = [];
const EMPTY_SERIES: OutcomeSeries[] = [];

// ============ Types ========================================================== //

type LegendEntry = {
  color: string;
  label: string;
  price: number;
  tokenId: string;
};

type PolymarketChartLegendProps = {
  backgroundColor: string;
  colors?: readonly string[];
};

// ============ PolymarketChartLegend ========================================== //

export const PolymarketChartLegend = memo(function PolymarketChartLegend({ backgroundColor, colors }: PolymarketChartLegendProps) {
  const series = usePolymarketChartStore(state => state.getData()?.series ?? EMPTY_SERIES, areSeriesEqual);

  const entries = useMemo(() => buildLegendEntries(series, colors), [series, colors]);
  const hasData = Boolean(entries.length);

  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: withSpring(hasData ? 1 : 0, SPRING_CONFIGS.snappyMediumSpringConfig) }),
    [hasData]
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ScrollView
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.contentContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {entries.map(entry => (
          <LegendItem color={entry.color} key={entry.tokenId} label={entry.label} price={entry.price} />
        ))}
      </ScrollView>

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
    </Animated.View>
  );
});

// ============ LegendItem ===================================================== //

const LegendItem = memo(function LegendItem({
  color,
  displayPrice,
  label,
  price,
}: {
  color: string;
  displayPrice?: boolean;
  label: string;
  price: number;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: color }, IS_IOS && { shadowColor: color }]} />
      {displayPrice ? (
        <TextShadow blur={20} shadowOpacity={0.3}>
          <Text color={{ custom: color }} numberOfLines={1} size="13pt" weight="bold">
            {formatPercent(price)}
          </Text>
        </TextShadow>
      ) : null}
      <Text color="labelQuaternary" numberOfLines={1} size="13pt" weight="bold">
        {label}
      </Text>
    </View>
  );
});

// ============ Utilities ====================================================== //

function buildLegendEntries(series: OutcomeSeries[], colors: readonly string[] | undefined): LegendEntry[] {
  if (!series.length || series.length === 1) return EMPTY_ENTRIES;

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
  return `${Math.round(value * 100)}%`;
}

function areSeriesEqual(prev: OutcomeSeries[], next: OutcomeSeries[]): boolean {
  return (next.length === 0 && prev.length > 0) || prev === next;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  container: {
    marginVertical: -LAYOUT.paddingVertical,
    overflow: 'visible',
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: LAYOUT.gapBetweenItems,
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.paddingHorizontal,
  },
  dot: {
    borderRadius: DOT.borderRadius,
    height: DOT.size,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: DOT.shadowOpacity,
    shadowRadius: DOT.shadowRadius,
    width: DOT.size,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: LAYOUT.gapDotToLabel,
  },
  leftFade: {
    height: '100%',
    left: -SCREEN_PADDING,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: EDGE_FADE_WIDTH,
  },
  rightFade: {
    height: '100%',
    pointerEvents: 'none',
    position: 'absolute',
    right: -SCREEN_PADDING,
    top: 0,
    width: EDGE_FADE_WIDTH,
  },
  scrollView: {
    flexGrow: 0,
    height: ITEM_HEIGHT + LAYOUT.paddingVertical * 2,
    overflow: 'visible',
    paddingVertical: LAYOUT.paddingVertical,
  },
});
