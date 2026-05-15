import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LargePerpMarketsCarousel } from '@/features/discover/components/carousels/LargePerpMarketsCarousel';
import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { CATEGORIES } from '@/features/polymarket/constants';
import * as i18n from '@/languages';

export const MarketsSection = memo(function MarketsSection() {
  return (
    <View style={styles.container}>
      {/* TODO: swap to the indices placement when available; using the generic perps placement as a placeholder. */}
      <LargePerpMarketsCarousel title={i18n.t(i18n.l.discover.placements.indices_title)} />
      {/* TODO: swap to the commodities placement when available; using the generic perps placement as a placeholder. */}
      <LargePerpMarketsCarousel title={i18n.t(i18n.l.discover.placements.commodities_title)} />
      <TaggedPolymarketCarousel tagSlug={CATEGORIES.finance.tagId} title="Predictions" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 32,
    paddingTop: 20,
  },
});
