import { StyleSheet, View } from 'react-native';

import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { LargePerpMarketsGrid } from '@/features/discover/components/grids/LargePerpMarketsGrid';
import { SECTION_VERTICAL_GAP } from '@/features/discover/constants';
import { navigateToPolymarketCategory } from '@/features/discover/utils/navigation';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsCryptoMajorsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import { CATEGORIES } from '@/features/polymarket/constants';
import * as i18n from '@/languages';

export function CryptoPage() {
  return (
    <View style={styles.container}>
      <CryptoMajorsGrid />
      <TaggedPolymarketCarousel
        onPressSeeAll={() => navigateToPolymarketCategory(CATEGORIES.crypto.tagId)}
        tagSlug={CATEGORIES.crypto.tagId}
        title="Predictions"
      />
    </View>
  );
}

function CryptoMajorsGrid() {
  const { isLoading, items, placement } = usePerpsCryptoMajorsPlacementStore();
  return (
    <LargePerpMarketsGrid
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
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
