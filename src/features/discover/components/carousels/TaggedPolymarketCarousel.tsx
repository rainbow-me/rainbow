import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import {
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/predictionMarketCards/PredictionMarketTileCard';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { getPolymarketEventsByTagStore } from '@/features/discover/stores/polymarketEventsByTagStore';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';

const ITEM_GAP = 8;

type Props = {
  onPressSeeAll?: () => void;
  tagSlug: string;
  title: string;
};

export const TaggedPolymarketCarousel = memo(function TaggedPolymarketCarousel({
  onPressSeeAll = navigateToPolymarket,
  tagSlug,
  title,
}: Props) {
  const useStore = getPolymarketEventsByTagStore(tagSlug);
  const events = useStore(state => state.getData()) ?? [];

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={onPressSeeAll} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          decelerationRate="fast"
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={PREDICTION_MARKET_TILE_CARD_WIDTH + ITEM_GAP}
        >
          {events.map(event => (
            <PredictionMarketTileCard key={event.id} event={event} />
          ))}
        </ScrollView>
      </View>
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    height: PREDICTION_MARKET_TILE_CARD_HEIGHT,
  },
  contentContainer: {
    gap: ITEM_GAP,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
});
