import React, { memo, useCallback } from 'react';
import { Box } from '@/design-system';
import { LegendList } from '@legendapp/list';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import { PerpMarket } from '@/features/perps/types';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';

type PerpMarketsListProps = {
  onPressMarket?: (market: PerpMarket) => void;
};

export const PerpMarketsList = memo(function PerpMarketsList({ onPressMarket }: PerpMarketsListProps) {
  const markets = useHyperliquidMarketsStore(state => state.getSearchResults());

  const renderItem = useCallback(({ item }: { item: PerpMarket }) => {
    return (
      <Box paddingBottom={'24px'}>
        <PerpMarketRow market={item} onPress={onPressMarket} />
      </Box>
    );
  }, []);

  const keyExtractor = useCallback((item: PerpMarket) => item.symbol, []);

  return (
    <LegendList
      data={markets}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: FOOTER_HEIGHT_WITH_SAFE_AREA }}
      style={{ flex: 1 }}
    />
  );
});
