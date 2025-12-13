import { memo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { useColorMode } from '@/design-system';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';
import { PolymarketEventCategorySelector } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventCategorySelector';
import { POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { useListen } from '@/state/internal/hooks/useListen';

export const PolymarketBrowseEventsScreen = memo(function PolymarketBrowseEventsScreen() {
  return (
    <View style={styles.container}>
      <PolymarketEventCategorySelector />
      <PolymarketBrowseEventsList />
    </View>
  );
});

const EMPTY_EVENTS: PolymarketEvent[] = [];

const PolymarketBrowseEventsList = memo(function PolymarketBrowseEventsList() {
  const { isDarkMode } = useColorMode();
  const events = usePolymarketEventsStore(state => state.getData());
  const isInitialLoad = usePolymarketEventsStore(state => state.getStatus('isInitialLoad'));

  const listRef = useRef<Animated.FlatList<PolymarketEvent>>(null);
  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);

  useListen(
    usePolymarketEventsStore,
    state => state.tagId,
    () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  );

  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  return (
    <View style={styles.listContainer}>
      <PolymarketEventsListBase events={events ?? EMPTY_EVENTS} isLoading={isInitialLoad} listRef={listRef} onScroll={onScroll} />
      <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    width: '100%',
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
});
