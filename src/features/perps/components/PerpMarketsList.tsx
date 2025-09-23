import { LegendList } from '@legendapp/list';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PerpMarketDisabledRow } from '@/features/perps/components/PerpMarketDisabledRow';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import { FOOTER_HEIGHT, FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { useFilteredHyperliquidMarkets, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarket } from '@/features/perps/types';

type PerpMarketsListProps = {
  onPressMarket?: (market: PerpMarket) => void;
};

const SCROLL_INSETS = { bottom: FOOTER_HEIGHT - 4 };

// -- [Christian] TODO: Re-add disabled markets
export const PerpMarketsList = memo(function PerpMarketsList({ onPressMarket }: PerpMarketsListProps) {
  // const markets = useHyperliquidMarketsStore(state => state.getSearchResults());
  const markets = useFilteredHyperliquidMarkets();
  // const positions = useHyperliquidAccountStore(state => state.getPositions());
  const priceChangeColors = usePerpsAccentColorContext().accentColors.priceChangeColors;

  const renderItem = useCallback(
    ({ item }: { item: PerpMarket }) => {
      // return positions[item.symbol] ? (
      //   <PerpMarketDisabledRow market={item} />
      // ) : (
      return <PerpMarketRow market={item} onPress={onPressMarket} paddingVertical={12} priceChangeColors={priceChangeColors} />;
      // );
    },
    [onPressMarket /* , positions */, priceChangeColors]
  );

  // const extraData = useMemo(() => positions, [positions]);

  return (
    <LegendList
      ListHeaderComponent={<View style={styles.listHeader} />}
      data={markets}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.contentContainer}
      // extraData={extraData}
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
