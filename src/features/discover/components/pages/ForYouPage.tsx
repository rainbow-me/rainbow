import { StyleSheet, View } from 'react-native';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { PerpMarketsCarousel } from '@/features/discover/components/carousels/PerpMarketsCarousel';
import { PredictionsCarousel } from '@/features/discover/components/carousels/PredictionsCarousel';
import { TokenList } from '@/features/discover/components/TokenList';
import { SECTION_VERTICAL_GAP } from '@/features/discover/constants';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import { usePredictionsPlacementStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import * as i18n from '@/languages';

export function ForYouPage() {
  return (
    <View style={styles.container}>
      <ForYouPerpsCarousel />
      <ForYouPredictionsCarousel />
      <ForYouTokensSection />
    </View>
  );
}

function ForYouPerpsCarousel() {
  const { isLoading, items, placement } = usePerpsPlacementStore();
  return (
    <PerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS}
      title={i18n.t(i18n.l.discover.placements.perps_title)}
    />
  );
}

function ForYouPredictionsCarousel() {
  const { isLoading, items, placement } = usePredictionsPlacementStore();
  return (
    <PredictionsCarousel
      isLoading={isLoading}
      items={items}
      placement={placement}
      placementId={PLACEMENT_IDS.PREDICTIONS}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
    />
  );
}

function ForYouTokensSection() {
  const { onTapSearch } = useDiscoverScreenContext();
  return (
    <View style={styles.tokensSection}>
      <CarouselHeader title="Tokens" onPress={onTapSearch} />
      <TokenList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    gap: SECTION_VERTICAL_GAP,
  },
  tokensSection: {
    gap: 20,
  },
});
