import { memo } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { PolymarketSportsEventsList } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketSportsEventsList';
import { PolymarketLeagueSelector } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketLeagueSelector';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { useListen } from '@/state/internal/hooks/useListen';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';

type PolymarketSportsEventsScreenProps = {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export const PolymarketSportsEventsScreen = memo(function PolymarketSportsEventsScreen({ onScroll }: PolymarketSportsEventsScreenProps) {
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
      <View style={styles.leagueSelectorContainer}>
        <PolymarketLeagueSelector />
      </View>
      <PolymarketSportsEventsList listRef={listRef} onScroll={onScroll} />
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
