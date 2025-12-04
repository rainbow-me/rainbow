import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Text, useColorMode } from '@/design-system';
import { OutcomeSeries } from '../types';
import { usePolymarketStore } from '../stores/polymarketStore';

// ============ Types ========================================================== //

type PolymarketLegendProps = {
  /** Series data to display */
  series: OutcomeSeries[];
  /** Whether to show current prices */
  showPrices?: boolean;
};

type LegendItemProps = {
  color: string;
  isHighlighted: boolean;
  label: string;
  onPress: () => void;
  price?: number;
};

// ============ LegendItem Component =========================================== //

const LegendItem = memo(function LegendItem({ color, isHighlighted, label, onPress, price }: LegendItemProps) {
  const { isDarkMode } = useColorMode();

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={styles.legendItem}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <Text color={isHighlighted ? 'label' : 'labelSecondary'} numberOfLines={1} size="13pt" weight={isHighlighted ? 'bold' : 'medium'}>
        {label}
      </Text>
      {price !== undefined && (
        <Text color="labelTertiary" size="13pt" weight="medium">
          {formatPercent(price)}
        </Text>
      )}
    </ButtonPressAnimation>
  );
});

// ============ Component ====================================================== //

export const PolymarketLegend = memo(function PolymarketLegend({ series, showPrices = true }: PolymarketLegendProps) {
  const highlightedSeriesId = usePolymarketStore(state => state.highlightedSeriesId);
  const setHighlightedSeriesId = usePolymarketStore(state => state.setHighlightedSeriesId);

  const handleItemPress = useCallback(
    (tokenId: string) => {
      if (highlightedSeriesId === tokenId) {
        setHighlightedSeriesId(null);
      } else {
        setHighlightedSeriesId(tokenId);
      }
    },
    [highlightedSeriesId, setHighlightedSeriesId]
  );

  if (!series.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {series.map(s => {
        const latestPrice = s.prices.length > 0 ? s.prices[s.prices.length - 1] : undefined;
        return (
          <LegendItem
            key={s.tokenId}
            color={s.color}
            isHighlighted={highlightedSeriesId === s.tokenId}
            label={s.label}
            onPress={() => handleItemPress(s.tokenId)}
            price={showPrices ? latestPrice : undefined}
          />
        );
      })}
    </View>
  );
});

// ============ Helpers ======================================================== //

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  colorDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
