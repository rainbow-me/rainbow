import React from 'react';

import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import {
  computePerpPillWidth,
  PERP_MARKET_PILL_HEIGHT,
  PerpMarketPill,
  PerpMarketPillSkeleton,
} from '@/features/discover/components/perpMarketCards/PerpMarketPill';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { type PlacementStoreResult } from '@/features/placements/stores/factories/createPlacementStore';
import { type PlacementId } from '@/features/placements/types';

const PERP_MARKET_PILL_INITIAL_SLOT_WIDTH = 220;

type PerpMarketPillsCarouselProps = PlacementStoreResult<PerpMarketPlacementItem> & {
  placementId: PlacementId;
  title: string;
  onPressSeeAll?: () => void;
};

export function PerpMarketPillsCarousel({
  isLoading,
  items,
  placement,
  placementId,
  title,
  onPressSeeAll = navigateToPerps,
}: PerpMarketPillsCarouselProps) {
  return (
    <MarketCarousel
      data={items}
      getItemWidth={getPerpPillItemWidth}
      itemHeight={PERP_MARKET_PILL_HEIGHT}
      itemWidth={PERP_MARKET_PILL_INITIAL_SLOT_WIDTH}
      loading={isLoading}
      onPressSeeAll={onPressSeeAll}
      placement={placement}
      placementId={placementId}
      renderItem={renderPerpPill}
      renderSkeleton={PerpMarketPillSkeleton}
      title={title}
    />
  );
}

function getPerpPillItemWidth(item: PerpMarketPlacementItem): number {
  return computePerpPillWidth(item.market);
}

function renderPerpPill(item: PerpMarketPlacementItem) {
  return <PerpMarketPill market={item.market} />;
}
