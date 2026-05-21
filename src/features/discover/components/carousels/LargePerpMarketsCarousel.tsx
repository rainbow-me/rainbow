import React from 'react';

import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import {
  LARGE_PERP_MARKET_CARD_HEIGHT,
  LARGE_PERP_MARKET_CARD_WIDTH,
  LargePerpMarketCard,
  LargePerpMarketCardSkeleton,
} from '@/features/discover/components/perpMarketCards/LargePerpMarketCard';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { type PlacementStoreResult } from '@/features/placements/stores/factories/createPlacementStore';
import { type PlacementId } from '@/features/placements/types';

type LargePerpMarketsCarouselProps = PlacementStoreResult<PerpMarketPlacementItem> & {
  placementId: PlacementId;
  title: string;
  onPressSeeAll?: () => void;
  showHeaderCaret?: boolean;
};

export function LargePerpMarketsCarousel({
  isLoading,
  items,
  placement,
  placementId,
  title,
  onPressSeeAll,
  showHeaderCaret,
}: LargePerpMarketsCarouselProps) {
  return (
    <MarketCarousel
      data={items}
      itemHeight={LARGE_PERP_MARKET_CARD_HEIGHT}
      itemWidth={LARGE_PERP_MARKET_CARD_WIDTH}
      loading={isLoading}
      onPressSeeAll={onPressSeeAll}
      placement={placement}
      placementId={placementId}
      renderItem={renderLargePerpCard}
      renderSkeleton={LargePerpMarketCardSkeleton}
      showHeaderCaret={showHeaderCaret}
      title={title}
    />
  );
}

function renderLargePerpCard(item: PerpMarketPlacementItem) {
  return <LargePerpMarketCard market={item.market} />;
}
