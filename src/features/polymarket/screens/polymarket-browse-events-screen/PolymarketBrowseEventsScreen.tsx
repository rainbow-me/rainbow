import { memo } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { useColorMode } from '@/design-system';
import { CATEGORIES, POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';
import { PolymarketEventCategorySelector } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventCategorySelector';
import { PolymarketSportsEventsScreen } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketSportsEventsScreen';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { useListen } from '@/state/internal/hooks/useListen';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { LEAGUE_SELECTOR_HEIGHT } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketLeagueSelector';

export const PolymarketBrowseEventsScreen = memo(function PolymarketBrowseEventsScreen() {
  return (
    <View style={styles.container}>
      <PolymarketEventCategorySelector />
      <PolymarketBrowseEventsList />
    </View>
  );
});

const EMPTY_EVENTS: PolymarketEvent[] = [];

const PolymarketBrowseEventsList = () => {
  const { isDarkMode } = useColorMode();
  const { eventsListRef } = usePolymarketContext();
  const isSportsCategory = usePolymarketCategoryStore(state => state.tagId === CATEGORIES.sports.tagId);

  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);

  useListen(
    usePolymarketCategoryStore,
    state => state.tagId,
    () => {
      eventsListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  );

  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  return (
    <View style={styles.listContainer}>
      {isSportsCategory ? <PolymarketSportsEventsScreen onScroll={onScroll} /> : <EventsList onScroll={onScroll} />}
      <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} topInset={isSportsCategory ? LEAGUE_SELECTOR_HEIGHT + 16 : 0} />
    </View>
  );
};

const EventsList = ({ onScroll }: { onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) => {
  const { eventsListRef } = usePolymarketContext();
  const events = usePolymarketEventsStore(state => state.getData() ?? EMPTY_EVENTS);
  return <PolymarketEventsListBase events={events} listRef={eventsListRef} onScroll={onScroll} />;
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
