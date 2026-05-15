import { StyleSheet, View } from 'react-native';

import { LargePerpMarketsCarousel } from '@/features/discover/components/carousels/LargePerpMarketsCarousel';
import { PerpMarketPillsCarousel } from '@/features/discover/components/carousels/PerpMarketPillsCarousel';
import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import * as i18n from '@/languages';

export function CryptoSection() {
  return (
    <View style={styles.container}>
      <PerpMarketPillsCarousel />
      <LargePerpMarketsCarousel title={i18n.t(i18n.l.discover.placements.perps_title)} onPressSeeAll={navigateToPerpsSearch} />
      <TaggedPolymarketCarousel tagSlug="crypto" title="Predictions" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 32,
    paddingTop: 20,
  },
});
