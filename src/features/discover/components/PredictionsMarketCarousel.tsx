import React from 'react';

import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';

const PLACEMENT_ID = PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL;

export function PredictionsMarketCarousel() {
  const placement = usePlacementsStore<Placement | undefined>(state => state.getPlacement(PLACEMENT_ID));
  const placementsLoading = usePlacementsStore(state => state.status === 'loading' || state.status === 'idle');

  // Items get filled in #7420 once Polymarket events dependency lands.
  const items = placement?.items ?? [];
  const isLoading = placementsLoading;

  if (!isLoading && items.length === 0) return null;

  return (
    <MarketCarousel
      placement={placement}
      placementId={PLACEMENT_ID}
      type="predictions"
      provider="polymarket"
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
      data={items}
      loading={isLoading}
      renderItem={() => null as never}
      onPressSeeAll={navigateToPolymarket}
    />
  );
}
