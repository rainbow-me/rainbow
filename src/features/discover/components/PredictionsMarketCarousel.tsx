import React from 'react';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';

export function PredictionsMarketCarousel() {
  const placementsLoading = usePlacementsStore(state => state.status === 'loading' || state.status === 'idle');

  // Hide until #7420 wires up the Polymarket events store and the items filter has dependent data to satisfy.
  const items: Placement['items'] = [];
  if (items.length === 0) return null;

  const isLoading = placementsLoading;
  return (
    <MarketCarousel
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
      data={items}
      loading={isLoading}
      onScrollSettle={() => {}}
      renderItem={() => null as never}
      onPressSeeAll={navigateToPolymarket}
    />
  );
}
