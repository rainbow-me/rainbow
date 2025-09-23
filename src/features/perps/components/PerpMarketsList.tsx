import { LegendList } from '@legendapp/list';
import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { PerpMarketDisabledRow } from '@/features/perps/components/PerpMarketDisabledRow';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import { FOOTER_HEIGHT, FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useFilteredHyperliquidMarkets } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarket } from '@/features/perps/types';
import { useHasPositionCheck } from '@/features/perps/stores/derived/useHasPositionCheck';

type PerpMarketsListProps = {
  onPressMarket?: (market: PerpMarket) => void;
};

const SCROLL_INSETS = { bottom: FOOTER_HEIGHT - 4 };

export const PerpMarketsList = memo(function PerpMarketsList({ onPressMarket }: PerpMarketsListProps) {
  const markets = useFilteredHyperliquidMarkets();
  const priceChangeColors = usePerpsAccentColorContext().accentColors.priceChangeColors;
  const checkIfPositionExists = useHasPositionCheck();

  const renderItem = useCallback(
    ({ item }: { item: PerpMarket }) => {
      return checkIfPositionExists(item.symbol) ? (
        <PerpMarketDisabledRow market={item} />
      ) : (
        <PerpMarketRow market={item} onPress={onPressMarket} paddingVertical={12} priceChangeColors={priceChangeColors} />
      );
    },
    [checkIfPositionExists, onPressMarket, priceChangeColors]
  );

  return (
    <LegendList
      ListHeaderComponent={<View style={styles.listHeader} />}
      data={markets}
      extraData={checkIfPositionExists}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.contentContainer}
      maintainVisibleContentPosition={false}
      recycleItems
      scrollIndicatorInsets={SCROLL_INSETS}
      style={styles.list}
    />
  );
});

function keyExtractor(item: PerpMarket): string {
  return item.symbol;
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: FOOTER_HEIGHT_WITH_SAFE_AREA - 12,
    paddingHorizontal: 20,
  },
  list: {
    flex: 1,
  },
  listItem: {
    paddingVertical: 2,
  },
  listHeader: {
    height: 12,
    width: '100%',
  },
});
