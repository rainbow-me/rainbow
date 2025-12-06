import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';
import { PolymarketEventCategorySelector } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventCategorySelector';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';

export const PolymarketBrowseEventsScreen = memo(function PolymarketBrowseEventsScreen() {
  return (
    <View style={styles.container}>
      <PolymarketEventCategorySelector />
      <PolymarketBrowseEventsList />
    </View>
  );
});

const PolymarketBrowseEventsList = memo(function PolymarketBrowseEventsList() {
  const isInitialLoad = usePolymarketEventsStore(state => state.getStatus('isInitialLoad'));
  const events = usePolymarketEventsStore(state => state.getData());

  return <PolymarketEventsListBase events={events ?? []} isLoading={isInitialLoad} />;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    gap: 12,
  },
});
