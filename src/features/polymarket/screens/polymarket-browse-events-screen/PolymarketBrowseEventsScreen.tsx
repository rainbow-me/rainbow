import { memo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';
import { PolymarketEventCategorySelector } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventCategorySelector';
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

const PolymarketBrowseEventsList = memo(function PolymarketBrowseEventsList() {
  const listRef = useRef<FlatList<PolymarketEvent>>(null);
  const isInitialLoad = usePolymarketEventsStore(state => state.getStatus('isInitialLoad'));
  const events = usePolymarketEventsStore(state => state.getData());

  useListen(
    usePolymarketEventsStore,
    state => state.tagId,
    () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  );

  return <PolymarketEventsListBase events={events ?? []} isLoading={isInitialLoad} listRef={listRef} />;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    gap: 12,
  },
});
