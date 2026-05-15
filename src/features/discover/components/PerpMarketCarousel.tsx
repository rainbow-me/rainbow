import React, { type ReactElement } from 'react';

import { MarketCarousel } from '@/features/discover/components/MarketCarousel';
import {
  computePerpCardWidth,
  PERP_MARKET_CARD_BORDER_RADIUS,
  PERP_MARKET_CARD_HEIGHT,
  PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART,
  PerpMarketCard,
} from '@/features/discover/components/PerpMarketCard';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsPlacementStore, type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import * as i18n from '@/languages';

/**
 * Renders the Discover perps placement as compact market cards.
 */
export function PerpMarketCarousel() {
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
      keyExtractor={getPlacementItemKey}
      onPressSeeAll={navigateToPerpsSearch}
      renderItem={renderPerpCard}
      skeletonBorderRadius={PERP_MARKET_CARD_BORDER_RADIUS}
      loading={isLoading}
    />
  );
}

function getPlacementItemKey(item: PerpMarketPlacementItem): string {
  return `${item.ref.source}:${item.ref.id}`;
}

function getPerpMarketItemWidth(item: PerpMarketPlacementItem): number {
  return computePerpCardWidth(item.market);
}

function renderPerpCard(item: PerpMarketPlacementItem, trackPress: (metadata?: PlacementItemAnalyticsMetadata) => void): ReactElement {
  return <PerpMarketCard market={item.market} onPressTracked={trackPress} />;
}
