import { memo, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import {
  SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS,
  SPORTS_EVENT_WIDGET_CARD_HEIGHT,
  SPORTS_EVENT_WIDGET_CARD_WIDTH,
  SportsEventWidgetCard,
} from '@/features/discover/components/sports/SportsEventWidgetCard';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { navigateToPolymarketCategory } from '@/features/discover/utils/navigation';
import { CATEGORIES } from '@/features/polymarket/constants';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getSportsEventTokenIds } from '@/features/polymarket/utils/sportsEventBetData';
import Routes from '@/navigation/routesNames';
import { addSubscribedTokens, removeSubscribedTokens, useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

const ITEM_GAP = 8;
const SKELETON_COUNT = 3;

type SportsEventsCarouselProps = {
  events: PolymarketEvent[];
  isLoading: boolean;
  onPressSeeAll?: () => void;
  title: string;
};

export const SportsEventsCarousel = memo(function SportsEventsCarousel({
  events,
  isLoading,
  onPressSeeAll = () => navigateToPolymarketCategory(CATEGORIES.sports.tagId),
  title,
}: SportsEventsCarouselProps) {
  const showSkeletons = isLoading && events.length === 0;
  const itemCount = showSkeletons ? SKELETON_COUNT : events.length;
  const snapToOffsets = useMemo(
    () => Array.from({ length: itemCount }).map((_, index) => index * (SPORTS_EVENT_WIDGET_CARD_WIDTH + ITEM_GAP)),
    [itemCount]
  );

  useSportsEventTokenSubscriptions(events);

  if (!showSkeletons && events.length === 0) return null;

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
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => <SportsEventsCarouselSkeleton key={index} />)
            : events.map(event => <SportsEventWidgetCard key={event.id} event={event} />)}
        </ScrollView>
      </View>
    </Box>
  );
});

function SportsEventsCarouselSkeleton() {
  return (
    <CarouselCardSkeleton
      borderRadius={SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS}
      height={SPORTS_EVENT_WIDGET_CARD_HEIGHT}
      width={SPORTS_EVENT_WIDGET_CARD_WIDTH}
    />
  );
}

function useSportsEventTokenSubscriptions(events: PolymarketEvent[]) {
  const tokenIds = useMemo(() => {
    const ids = new Set<string>();
    for (const event of events) {
      for (const tokenId of getSportsEventTokenIds(event)) {
        ids.add(tokenId);
      }
    }
    return Array.from(ids);
  }, [events]);
  const subscriptionKey = tokenIds.join(',');

  useEffect(() => {
    if (!subscriptionKey) return;

    addSubscribedTokens({ route: Routes.DISCOVER_SCREEN, tokenIds });
    useLiveTokensStore.getState().fetch(undefined, { force: true });

    return () => {
      removeSubscribedTokens({ route: Routes.DISCOVER_SCREEN, tokenIds });
    };
  }, [subscriptionKey, tokenIds]);
}

const styles = StyleSheet.create({
  container: {
    height: SPORTS_EVENT_WIDGET_CARD_HEIGHT,
  },
  contentContainer: {
    gap: ITEM_GAP,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
});
