import { memo } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { PolymarketLeagueSelector } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketLeagueSelector';
import { PolymarketSportsEventsList } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketSportsEventsList';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { useListen } from '@/state/internal/hooks/useListen';

type PolymarketSportsEventsScreenProps = {
  onPressLeagueHeader?: (leagueId: string) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  showLeagueSelector?: boolean;
  truncateSections?: boolean;
};

export const PolymarketSportsEventsScreen = memo(function PolymarketSportsEventsScreen({
  onPressLeagueHeader,
  onScroll,
  showLeagueSelector = true,
  truncateSections = false,
}: PolymarketSportsEventsScreenProps) {
  const { eventsListRef: listRef } = usePolymarketContext();

  useListen(
    usePolymarketSportsEventsStore,
    state => state.selectedLeagueId,
    () => {
      listRef?.current?.scrollToOffset({ offset: 0, animated: true });
    }
  );

  return (
    <View style={styles.container}>
      {showLeagueSelector ? (
        <View style={styles.leagueSelectorContainer}>
          <PolymarketLeagueSelector />
        </View>
      ) : null}
      <PolymarketSportsEventsList
        listRef={listRef}
        onPressLeagueHeader={onPressLeagueHeader}
        onScroll={onScroll}
        truncateSections={truncateSections}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  leagueSelectorContainer: {
    alignSelf: 'center',
  },
});
