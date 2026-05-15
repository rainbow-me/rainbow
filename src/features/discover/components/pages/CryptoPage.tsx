import { StyleSheet, View } from 'react-native';

import { PerpMarketPillsCarousel } from '@/features/discover/components/carousels/PerpMarketPillsCarousel';
import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { LargePerpMarketsGrid } from '@/features/discover/components/grids/LargePerpMarketsGrid';
import { SECTION_VERTICAL_GAP } from '@/features/discover/constants';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsCryptoMajorsPlacementStore, usePerpsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import * as i18n from '@/languages';

export function CryptoPage() {
  return (
    <View style={styles.container}>
      <FeaturedCryptoPerpsCarousel />
      <CryptoMajorsGrid />
      <TaggedPolymarketCarousel tagSlug="crypto" title="Predictions" />
    </View>
  );
}

function FeaturedCryptoPerpsCarousel() {
  const { isLoading, items, placement } = usePerpsPlacementStore();
  return (
    <PerpMarketPillsCarousel
      isLoading={isLoading}
      items={items}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS}
      title={i18n.t(i18n.l.discover.placements.perps_title)}
    />
  );
}

function CryptoMajorsGrid() {
  const { isLoading, items, placement } = usePerpsCryptoMajorsPlacementStore();
  return (
    <LargePerpMarketsGrid
      isLoading={isLoading}
      items={items}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_CRYPTO_MAJORS}
      title={i18n.t(i18n.l.discover.placements.majors_title)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SECTION_VERTICAL_GAP,
    paddingTop: 20,
  },
});
