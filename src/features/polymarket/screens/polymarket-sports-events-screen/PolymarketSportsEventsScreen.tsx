import { memo, RefObject } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import {
  PolymarketSportsEventsList,
  SportsListItem,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketSportsEventsList';
import Animated from 'react-native-reanimated';
import { PolymarketLeagueSelector } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketLeagueSelector';

type PolymarketSportsEventsScreenProps = {
  listRef?: RefObject<Animated.FlatList<SportsListItem> | null>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export const PolymarketSportsEventsScreen = memo(function PolymarketSportsEventsScreen({
  listRef,
  onScroll,
}: PolymarketSportsEventsScreenProps) {
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
