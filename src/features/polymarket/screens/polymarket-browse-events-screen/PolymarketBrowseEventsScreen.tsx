import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useListen } from '@storesjs/stores';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { useColorMode } from '@/design-system';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';
import {
  CATEGORIES,
  NAVIGATOR_FOOTER_HEIGHT,
  POLYMARKET_BACKGROUND_DARK,
  POLYMARKET_BACKGROUND_LIGHT,
} from '@/features/polymarket/constants';
import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { PolymarketEventCategorySelector } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventCategorySelector';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { polymarketEventsActions, usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { SportsGamesList } from '@/features/sports/ui/SportsGamesList';

export const PolymarketBrowseEventsScreen = memo(function PolymarketBrowseEventsScreen() {
  return (
    <View style={styles.container}>
      <PolymarketEventCategorySelector />
      <PolymarketBrowseEventsList />
    </View>
  );
});

const PolymarketBrowseEventsList = () => {
  const { isDarkMode } = useColorMode();
  const { sportsGamesListRef, scrollBrowseToTop } = usePolymarketContext();
  const safeAreaInsets = useSafeAreaInsets();

  const isSportsCategory = usePolymarketCategoryStore(s => s.tagId === CATEGORIES.sports.tagId);
  const scrollOffset = useSharedValue(0);

  const onGamePress = useSportsGamePress();

  useListen(usePolymarketCategoryStore, s => s.tagId, scrollBrowseToTop);

  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  return (
    <View style={styles.listContainer}>
      {isSportsCategory ? (
        <SportsGamesList
          ref={sportsGamesListRef}
          host="predictions"
          bottomInset={safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT}
          onGamePress={onGamePress}
          scrollOffset={scrollOffset}
        />
      ) : (
        <EventsList scrollOffset={scrollOffset} />
      )}
      <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} />
    </View>
  );
};

const EventsList = ({ scrollOffset }: { scrollOffset: SharedValue<number> }) => {
  const onScroll = useScrollFadeHandler(scrollOffset);
  const { eventsListRef } = usePolymarketContext();
  const events = usePolymarketEventsStore(state => state.getEvents());

  return (
    <PolymarketEventsListBase
      events={events}
      listRef={eventsListRef}
      onEndReached={polymarketEventsActions.fetchNextPage}
      onEndReachedThreshold={1}
      onScroll={onScroll}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
});
