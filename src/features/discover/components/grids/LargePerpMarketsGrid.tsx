import React, { useCallback } from 'react';

import { MarketGrid } from '@/features/discover/components/grid/MarketGrid';
import {
  LARGE_PERP_MARKET_CARD_HEIGHT,
  LargePerpMarketCard,
  LargePerpMarketCardSkeleton,
} from '@/features/discover/components/perpMarketCards/LargePerpMarketCard';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { type PlacementStoreResult } from '@/features/placements/stores/factories/createPlacementStore';
import { type PlacementId } from '@/features/placements/types';

type LargePerpMarketsGridProps = PlacementStoreResult<PerpMarketPlacementItem> & {
  placementId: PlacementId;
  title: string;
  onPressSeeAll?: () => void;
};

export function LargePerpMarketsGrid({ isLoading, items, placement, placementId, title, onPressSeeAll }: LargePerpMarketsGridProps) {
  const renderItem = useCallback(
    (item: PerpMarketPlacementItem, cellWidth: number) => <LargePerpMarketCard market={item.market} width={cellWidth} />,
    []
  );

  const renderSkeleton = useCallback((cellWidth: number) => <LargePerpMarketCardSkeleton width={cellWidth} />, []);

  return (
    <MarketGrid
      data={items}
      itemHeight={LARGE_PERP_MARKET_CARD_HEIGHT}
      loading={isLoading}
      onPressSeeAll={onPressSeeAll}
      placement={placement}
      placementId={placementId}
      renderItem={renderItem}
      renderSkeleton={renderSkeleton}
      title={title}
    />
  );
}
