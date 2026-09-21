import { memo } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useListen } from '@storesjs/stores';
import { useSharedValue } from 'react-native-reanimated';
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
import { SportsBrowse } from '@/features/sports/ui/SportsBrowse';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

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
  const { sportsBrowseRef, scrollBrowseToTop } = usePolymarketContext();
  const safeAreaInsets = useSafeAreaInsets();
  const visible = useNavigationStore(state => state.activeRoute === Routes.POLYMARKET_BROWSE_EVENTS_SCREEN);
  const isSportsCategory = usePolymarketCategoryStore(state => state.tagId === CATEGORIES.sports.tagId);
  const onGamePress = useSportsGamePress(Routes.POLYMARKET_BROWSE_EVENTS_SCREEN);

  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);

  useListen(usePolymarketCategoryStore, state => state.tagId, scrollBrowseToTop);

  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  return (
    <View style={styles.listContainer}>
      {isSportsCategory ? (
        <SportsBrowse
          ref={sportsBrowseRef}
          host="predictions"
          visible={visible}
          route={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}
          bottomInset={safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT}
          onGamePress={onGamePress}
          onScroll={onScroll}
        />
      ) : (
        <EventsList onScroll={onScroll} />
      )}
      <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} />
    </View>
  );
};

const EventsList = ({ onScroll }: { onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) => {
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
