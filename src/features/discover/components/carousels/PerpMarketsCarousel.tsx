import React from 'react';

import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import {
  computePerpCardWidth,
  PERP_MARKET_CARD_HEIGHT,
  PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART,
  PerpMarketCard,
  PerpMarketCardSkeleton,
} from '@/features/discover/components/perpMarketCards/PerpMarketCard';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { type PlacementStoreResult } from '@/features/placements/stores/factories/createPlacementStore';
import { type PlacementId } from '@/features/placements/types';

type PerpMarketsCarouselProps = PlacementStoreResult<PerpMarketPlacementItem> & {
  placementId: PlacementId;
  title: string;
  onPressSeeAll?: () => void;
};

export function PerpMarketsCarousel({
  isLoading,
  items,
  placement,
  placementId,
  title,
  onPressSeeAll = navigateToPerpsSearch,
}: PerpMarketsCarouselProps) {
  return (
    <MarketCarousel
      data={items}
      getItemWidth={getPerpMarketItemWidth}
      itemHeight={PERP_MARKET_CARD_HEIGHT}
      itemWidth={PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART}
      loading={isLoading}
      onPressSeeAll={onPressSeeAll}
      placement={placement}
      placementId={placementId}
      renderItem={renderPerpCard}
      renderSkeleton={PerpMarketCardSkeleton}
      title={title}
    />
  );
}

function getPerpMarketItemWidth(item: PerpMarketPlacementItem): number {
  return computePerpCardWidth(item.market);
}

function renderPerpCard(item: PerpMarketPlacementItem) {
  return <PerpMarketCard market={item.market} />;
}
