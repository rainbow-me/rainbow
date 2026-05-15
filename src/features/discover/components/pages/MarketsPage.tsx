import { StyleSheet, View } from 'react-native';

import { LargePerpMarketsCarousel } from '@/features/discover/components/carousels/LargePerpMarketsCarousel';
import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsCommoditiesPlacementStore, usePerpsIndicesPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import { CATEGORIES } from '@/features/polymarket/constants';
import * as i18n from '@/languages';

export function MarketsPage() {
  return (
    <View style={styles.container}>
      <IndicesCarousel />
      <CommoditiesCarousel />
      <TaggedPolymarketCarousel tagSlug={CATEGORIES.finance.tagId} title="Predictions" />
    </View>
  );
}

function IndicesCarousel() {
  const { isLoading, items, placement } = usePerpsIndicesPlacementStore();
  return (
    <LargePerpMarketsCarousel
      isLoading={isLoading}
      items={items}
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
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_COMMODITIES}
      title={i18n.t(i18n.l.discover.placements.commodities_title)}
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
