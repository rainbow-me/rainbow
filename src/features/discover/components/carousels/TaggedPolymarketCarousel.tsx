import { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import {
  PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
  PREDICTION_MARKET_TILE_CARD_HEIGHT,
  PREDICTION_MARKET_TILE_CARD_WIDTH,
  PredictionMarketTileCard,
} from '@/features/discover/components/predictionMarketCards/PredictionMarketTileCard';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { getPolymarketEventsByTagStore } from '@/features/discover/stores/polymarketEventsByTagStore';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';

const ITEM_GAP = 8;
const ITEM_VERTICAL_BLEED = 28;
const SKELETON_COUNT = 3;

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
  const isInitialLoad = useStore(state => state.getStatus('isInitialLoad'));
  const isIdle = useStore(state => state.getStatus('isIdle'));
  const showSkeletons = (isInitialLoad || isIdle) && events.length === 0;
  const snapToOffsets = useMemo(
    () =>
      Array.from({ length: showSkeletons ? SKELETON_COUNT : events.length }).map((_, index) =>
        index === 0 ? 0 : SCREEN_HORIZONTAL_PADDING + index * (PREDICTION_MARKET_TILE_CARD_WIDTH + ITEM_GAP)
      ),
    [events.length, showSkeletons]
  );

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={onPressSeeAll} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          decelerationRate="fast"
          disableIntervalMomentum
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToOffsets={snapToOffsets}
        >
          {showSkeletons
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => <TaggedPolymarketCarouselSkeleton key={index} />)
            : events.map(event => <PredictionMarketTileCard key={event.id} event={event} />)}
        </ScrollView>
      </View>
    </Box>
  );
});

function TaggedPolymarketCarouselSkeleton() {
  return (
    <CarouselCardSkeleton
      borderRadius={PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS}
      height={PREDICTION_MARKET_TILE_CARD_HEIGHT}
      width={PREDICTION_MARKET_TILE_CARD_WIDTH}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: PREDICTION_MARKET_TILE_CARD_HEIGHT + ITEM_VERTICAL_BLEED * 2,
    marginVertical: -ITEM_VERTICAL_BLEED,
  },
  contentContainer: {
    gap: ITEM_GAP,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingVertical: ITEM_VERTICAL_BLEED,
  },
});
