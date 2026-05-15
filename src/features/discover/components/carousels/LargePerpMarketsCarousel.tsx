import React from 'react';

import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import {
  LARGE_PERP_MARKET_CARD_HEIGHT,
  LARGE_PERP_MARKET_CARD_WIDTH,
  LargePerpMarketCard,
  LargePerpMarketCardSkeleton,
} from '@/features/discover/components/perpMarketCards/LargePerpMarketCard';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsPlacementStore, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';

type LargePerpMarketsCarouselProps = {
  title: string;
  onPressSeeAll?: () => void;
};

/**
 * Renders the perps placement as a row of large market cards.
 * Callers supply their own title — the same component currently serves as a
 * placeholder for indices/commodities until those placements ship.
 */
export function LargePerpMarketsCarousel({ title, onPressSeeAll }: LargePerpMarketsCarouselProps) {
  const { isLoading, items, placement } = usePerpsPlacementStore();

  return (
    <MarketCarousel
      data={items}
      itemHeight={LARGE_PERP_MARKET_CARD_HEIGHT}
      itemWidth={LARGE_PERP_MARKET_CARD_WIDTH}
      loading={isLoading}
      onPressSeeAll={onPressSeeAll}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS}
      renderItem={renderLargePerpCard}
      renderSkeleton={LargePerpMarketCardSkeleton}
      title={title}
    />
  );
}

function renderLargePerpCard(item: PerpMarketPlacementItem) {
  return <LargePerpMarketCard market={item.market} />;
}
