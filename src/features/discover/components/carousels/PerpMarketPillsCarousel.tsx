import React from 'react';

import { MarketCarousel } from '@/features/discover/components/carousel/MarketCarousel';
import {
  computePerpPillWidth,
  PERP_MARKET_PILL_HEIGHT,
  PerpMarketPill,
  PerpMarketPillSkeleton,
} from '@/features/discover/components/perpMarketCards/PerpMarketPill';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsPlacementStore, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import * as i18n from '@/languages';

const PERP_MARKET_PILL_INITIAL_SLOT_WIDTH = 220;

export function PerpMarketPillsCarousel() {
  const { isLoading, items, placement } = usePerpsPlacementStore();

  return (
    <MarketCarousel
      data={items}
      getItemWidth={getPerpPillItemWidth}
      itemHeight={PERP_MARKET_PILL_HEIGHT}
      itemWidth={PERP_MARKET_PILL_INITIAL_SLOT_WIDTH}
      loading={isLoading}
      onPressSeeAll={navigateToPerps}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS}
      renderItem={renderPerpPill}
      renderSkeleton={PerpMarketPillSkeleton}
      title={i18n.t(i18n.l.discover.placements.perps_title)}
    />
  );
}

function getPerpPillItemWidth(item: PerpMarketPlacementItem): number {
  return computePerpPillWidth(item.market);
}

function renderPerpPill(item: PerpMarketPlacementItem) {
  return <PerpMarketPill market={item.market} />;
}
