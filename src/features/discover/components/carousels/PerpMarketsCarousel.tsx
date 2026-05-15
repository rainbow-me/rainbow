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
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsPlacementStore, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import * as i18n from '@/languages';

export function PerpMarketsCarousel() {
  const { isLoading, items, placement } = usePerpsPlacementStore();

  return (
    <MarketCarousel
      title={i18n.t(i18n.l.discover.placements.perps_title)}
      placementId={PLACEMENT_IDS.PERPS}
      placement={placement}
      itemHeight={PERP_MARKET_CARD_HEIGHT}
      itemWidth={PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART}
      getItemWidth={getPerpMarketItemWidth}
      data={items}
      onPressSeeAll={navigateToPerpsSearch}
      renderItem={renderPerpCard}
      renderSkeleton={PerpMarketCardSkeleton}
      loading={isLoading}
    />
  );
}

function getPerpMarketItemWidth(item: PerpMarketPlacementItem): number {
  return computePerpCardWidth(item.market);
}

function renderPerpCard(item: PerpMarketPlacementItem) {
  return <PerpMarketCard market={item.market} />;
}
