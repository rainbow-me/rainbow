import React from 'react';

import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';

const PLACEMENT_ID = PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL;

export function PerpsMarketCarousel() {
  const placement = usePlacementsStore<Placement | undefined>(state => state.getPlacement(PLACEMENT_ID));
  const placementsLoading = usePlacementsStore(state => state.status === 'loading' || state.status === 'idle');

  // Hide until #7418 wires up the HyperliquidMarkets store + card renderer; the data-availability check has no real source to satisfy on this branch.
  const items: Placement['items'] = [];
  if (items.length === 0) return null;

  const isLoading = placementsLoading;
  return (
    <MarketCarousel
      placement={placement}
      placementId={PLACEMENT_ID}
      type="perps"
      provider="hyperliquid"
      title={i18n.t(i18n.l.discover.placements.perps_title)}
      data={items}
      loading={isLoading}
      renderItem={() => null as never}
      onPressSeeAll={navigateToPerps}
    />
  );
}
