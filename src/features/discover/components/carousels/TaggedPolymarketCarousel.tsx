import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { getPolymarketEventsByTagStore } from '@/features/discover/stores/polymarketEventsByTagStore';
import {
  HEIGHT as POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const ITEM_GAP = 8;
const TILE_WIDTH = (DEVICE_WIDTH - SCREEN_HORIZONTAL_PADDING * 2 - ITEM_GAP) / 2;

type Props = { tagSlug: string; title: string };

export const TaggedPolymarketCarousel = memo(function TaggedPolymarketCarousel({ tagSlug, title }: Props) {
  const useStore = getPolymarketEventsByTagStore(tagSlug);
  const events = useStore(state => state.getData()) ?? [];

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={() => navigateToPolymarket()} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          decelerationRate="fast"
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TILE_WIDTH + ITEM_GAP}
        >
          {events.map(event => (
            <PolymarketEventsListItem key={event.id} event={event} style={styles.tile} />
          ))}
        </ScrollView>
      </View>
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
  },
  contentContainer: {
    gap: ITEM_GAP,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
  tile: {
    height: POLYMARKET_EVENTS_LIST_ITEM_HEIGHT,
    width: TILE_WIDTH,
  },
});
