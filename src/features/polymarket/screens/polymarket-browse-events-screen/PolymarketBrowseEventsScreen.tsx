import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PolymarketEventsList } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventsList';
import { PolymarketEventCategorySelector } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketEventCategorySelector';

export const PolymarketBrowseEventsScreen = memo(function PolymarketBrowseEventsScreen() {
  return (
    <View style={styles.container}>
      <PolymarketEventCategorySelector />
      <PolymarketEventsList />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    gap: 12,
  },
});
