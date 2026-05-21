import { StyleSheet, View } from 'react-native';

import { LargePerpMarketsCarousel } from '@/features/discover/components/carousels/LargePerpMarketsCarousel';
import { PerpMarketPillsCarousel } from '@/features/discover/components/carousels/PerpMarketPillsCarousel';
import { PerpMarketsCarousel } from '@/features/discover/components/carousels/PerpMarketsCarousel';
import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { navigateToPolymarketCategory } from '@/features/discover/utils/navigation';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import {
  usePerpsCommoditiesPlacementStore,
  usePerpsIndicesPlacementStore,
  usePerpsStocksNewPlacementStore,
  usePerpsStocksPlacementStore,
} from '@/features/placements/stores/derived/perpsPlacementStore';
import { CATEGORIES } from '@/features/polymarket/constants';
import * as i18n from '@/languages';

export function MarketsPage() {
  return (
    <View style={styles.container}>
      <IndicesCarousel />
      <CommoditiesCarousel />
      <StocksCarousel />
      <NewMarketsCarousel />
      <TaggedPolymarketCarousel
        onPressSeeAll={() => navigateToPolymarketCategory(CATEGORIES.finance.tagId)}
        tagSlug={CATEGORIES.finance.tagId}
        title="Predictions"
      />
    </View>
  );
}

function IndicesCarousel() {
  const { isLoading, items, placement } = usePerpsIndicesPlacementStore();
  return (
    <LargePerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_INDICES}
      title={i18n.t(i18n.l.discover.placements.indices_title)}
    />
  );
}

function CommoditiesCarousel() {
  const { isLoading, items, placement } = usePerpsCommoditiesPlacementStore();
  return (
    <LargePerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_COMMODITIES}
      title={i18n.t(i18n.l.discover.placements.commodities_title)}
    />
  );
}

function StocksCarousel() {
  const { isLoading, items, placement } = usePerpsStocksPlacementStore();
  return (
    <PerpMarketPillsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_STOCKS}
      title="Stocks"
    />
  );
}

function NewMarketsCarousel() {
  const { isLoading, items, placement } = usePerpsStocksNewPlacementStore();
  return (
    <PerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_STOCKS_NEW}
      title="New"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 32,
    paddingTop: 20,
  },
});
