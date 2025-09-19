import React, { memo, useCallback, useMemo } from 'react';
import { Box } from '@/design-system';
import { LegendList } from '@legendapp/list';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import { PerpMarketDisabledRow } from '@/features/perps/components/PerpMarketDisabledRow';
import { PerpMarket } from '@/features/perps/types';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';

type PerpMarketsListProps = {
  onPressMarket?: (market: PerpMarket) => void;
};

export const PerpMarketsList = memo(function PerpMarketsList({ onPressMarket }: PerpMarketsListProps) {
  const markets = useHyperliquidMarketsStore(state => state.getSearchResults());
  const positions = useHyperliquidAccountStore(state => state.positions);

  const renderItem = useCallback(
    ({ item }: { item: PerpMarket }) => {
      return (
        <Box paddingBottom={'24px'}>
          {positions[item.symbol] ? <PerpMarketDisabledRow market={item} /> : <PerpMarketRow market={item} onPress={onPressMarket} />}
        </Box>
      );
    },
    [onPressMarket, positions]
  );

  const keyExtractor = useCallback((item: PerpMarket) => item.symbol, []);

  const extraData = useMemo(() => positions, [positions]);

  return (
    <LegendList
      data={markets}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: FOOTER_HEIGHT_WITH_SAFE_AREA }}
      style={{ flex: 1 }}
      extraData={extraData}
    />
  );
});
