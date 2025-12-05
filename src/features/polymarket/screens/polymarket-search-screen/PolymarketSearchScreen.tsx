import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/design-system';
import { usePolymarketEventSearchStore } from '@/features/polymarket/stores/polymarketEventSearchStore';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';

export const PolymarketSearchScreen = memo(function PolymarketSearchScreen() {
  return (
    <View style={styles.container}>
      <SearchResults />
    </View>
  );
});

const SearchResults = memo(function SearchResults() {
  const hasSearchQuery = usePolymarketEventSearchStore(state => state.searchQuery.trim().length > 0);
  const isLoading = usePolymarketEventSearchStore(state => state.getStatus('isLoading'));
  const events = usePolymarketEventSearchStore(state => state.getEvents());

  if (!hasSearchQuery) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text size="17pt" weight="bold" color="labelSecondary" align="center">
          {'Search for prediction markets'}
        </Text>
      </View>
    );
  }

  if (!events.length && !isLoading) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text size="17pt" weight="bold" color="labelSecondary" align="center">
          {'No results found'}
        </Text>
      </View>
    );
  }

  return <PolymarketEventsListBase events={events} isLoading={isLoading} />;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
});
