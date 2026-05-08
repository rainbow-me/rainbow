import React, { useCallback, useMemo } from 'react';

import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { convertStoredPerpPriceChangeToPercent, formatCompactPerpPercentChange } from '@/features/perps/utils';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import * as i18n from '@/languages';

import { MarketCarousel } from './MarketCarousel';
import { computePerpCardWidth, PERP_MARKET_CARD_HEIGHT, PerpMarketCard } from './PerpMarketCard';

const PLACEMENT_ID = PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL;

export function PerpsMarketCarousel() {
  const placement = usePlacementsStore<Placement | undefined>(state => state.getPlacement(PLACEMENT_ID));
  const placementsLoading = usePlacementsStore(state => state.status === 'loading' || state.status === 'idle');
  const markets = useHyperliquidMarketsStore(state => state.markets);
  const marketsLoading = useHyperliquidMarketsStore(state => state.status === 'loading' || state.status === 'idle');

  const items = useMemo(
    () => placement?.items.filter(item => item.ref.source === 'hyperliquid' && markets[item.ref.id] !== undefined) ?? [],
    [placement, markets]
  );
  const isLoading = placementsLoading || marketsLoading;
  const getPerpCardWidth = useCallback(
    (item: PlacementItem): number => {
      const market = markets[item.ref.id];
      const percentChange = market
        ? convertStoredPerpPriceChangeToPercent(market.priceChange['1h'] ?? market.priceChange['24h'])
        : undefined;

      return computePerpCardWidth({
        percentChangeText: percentChange === undefined ? undefined : formatCompactPerpPercentChange(percentChange),
        symbol: market?.baseSymbol ?? item.ref.id,
      });
    },
    [markets]
  );

  if (!isLoading && items.length === 0) return null;

  const renderItem = (item: PlacementItem) => (placement ? <PerpMarketCard item={item} placement={placement} /> : <></>);

  return (
    <MarketCarousel
      data={items}
      getItemWidth={getPerpCardWidth}
      itemHeight={PERP_MARKET_CARD_HEIGHT}
      itemWidth={computePerpCardWidth({})}
      loading={isLoading}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_ID}
      provider="hyperliquid"
      renderItem={renderItem}
      title={i18n.t(i18n.l.discover.placements.perps_title)}
      type="perps"
    />
  );
}
