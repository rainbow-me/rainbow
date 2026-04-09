import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design-system';
import { PolymarketEventsListBase } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListBase';
import { polymarketEventSearchActions, usePolymarketEventSearchStore } from '@/features/polymarket/stores/polymarketEventSearchStore';
import * as i18n from '@/languages';

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
          {i18n.t(i18n.l.predictions.search.placeholder)}
        </Text>
      </View>
    );
  }

  if (!events.length && !isLoading) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text size="17pt" weight="bold" color="labelSecondary" align="center">
          {i18n.t(i18n.l.predictions.search.no_results)}
        </Text>
      </View>
    );
  }

  return <PolymarketEventsListBase events={events} onEndReached={polymarketEventSearchActions.fetchNextPage} />;
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
