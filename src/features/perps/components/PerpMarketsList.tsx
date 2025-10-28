import { LegendList } from '@legendapp/list';
import React, { memo, useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PerpMarketDisabledRow } from '@/features/perps/components/PerpMarketDisabledRow';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import { FOOTER_HEIGHT, FOOTER_HEIGHT_WITH_SAFE_AREA, HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useHasPositionCheck } from '@/features/perps/stores/derived/useHasPositionCheck';
import { useFilteredHyperliquidMarkets } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarket } from '@/features/perps/types';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import infinityIcon from '@/assets/infinity.png';

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
        <PerpMarketDisabledRow market={item} paddingVertical={12} />
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
      ListEmptyComponent={<ListEmptyComponent />}
    />
  );
});

function keyExtractor(item: PerpMarket): string {
  return item.symbol;
}

const ListEmptyComponent = memo(function ListEmptyComponent() {
  return (
    <Box justifyContent="center" alignItems="center" paddingTop="32px">
      <Text align="center" size="20pt" weight="heavy" color="labelSecondary">
        {i18n.t(i18n.l.perps.search.no_markets_found)}
      </Text>
    </Box>
  );
});

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
