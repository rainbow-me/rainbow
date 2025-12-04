import { StyleSheet, View } from 'react-native';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { memo, useCallback } from 'react';
import { LegendList } from '@legendapp/list';
import { NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PolymarketEventCard } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventCard';

const ITEM_GAP = 12;
const PADDING_HORIZONTAL = 12;
const EFFECTIVE_PADDING_HORIZONTAL = PADDING_HORIZONTAL - ITEM_GAP / 2;

export const PolymarketEventsList = memo(function PolymarketEventsList() {
  const safeAreaInsets = useSafeAreaInsets();
  // TODO: Skeleton loading state
  const events = usePolymarketEventsStore(state => state.getData());

  const renderItem = useCallback(({ item }: { item: PolymarketEvent }) => {
    return (
      <View style={styles.itemWrapper}>
        <PolymarketEventCard event={item} />
      </View>
    );
  }, []);

  const paddingBottom = NAVIGATOR_FOOTER_HEIGHT + safeAreaInsets.bottom + 12;

  return (
    <LegendList
      data={events ?? []}
      numColumns={2}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingBottom, paddingHorizontal: EFFECTIVE_PADDING_HORIZONTAL }}
      recycleItems
      scrollIndicatorInsets={{ bottom: paddingBottom }}
      style={styles.list}
    />
  );
});

function keyExtractor(item: PolymarketEvent): string {
  return item.id;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  itemWrapper: {
    margin: ITEM_GAP / 2,
  },
});
