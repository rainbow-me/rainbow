import React, { type ReactElement } from 'react';

import { MarketCarousel } from '@/features/discover/components/MarketCarousel';
import {
  computePerpCardWidth,
  PERP_MARKET_CARD_HEIGHT,
  PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART,
  PerpMarketCard,
} from '@/features/discover/components/PerpMarketCard';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPerpsPlacement, type DiscoverPerpMarketItem } from '@/features/placements/stores/discover/discoverPerpsPlacementStore';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import * as i18n from '@/languages';

/**
 * Renders the Discover perps placement as compact market cards.
 */
export function PerpMarketCarousel() {
  const { isLoading, items, placement } = useDiscoverPerpsPlacement();

  return (
    <MarketCarousel
      title={i18n.t(i18n.l.discover.placements.perps_title)}
      placementId={PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL}
      placement={placement}
      itemHeight={PERP_MARKET_CARD_HEIGHT}
      itemWidth={PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART}
      getItemWidth={getPerpMarketItemWidth}
      data={items}
      keyExtractor={getPlacementItemKey}
      renderItem={renderPerpCard}
      onPressSeeAll={navigateToPerpsSearch}
      loading={isLoading}
    />
  );
}

function getPlacementItemKey(item: DiscoverPerpMarketItem): string {
  return `${item.ref.source}:${item.ref.id}`;
}

function getPerpMarketItemWidth(item: DiscoverPerpMarketItem): number {
  return computePerpCardWidth(item.market);
}

function renderPerpCard(item: DiscoverPerpMarketItem, trackPress: (metadata?: PlacementItemAnalyticsMetadata) => void): ReactElement {
  return <PerpMarketCard market={item.market} onPressTracked={trackPress} />;
}
