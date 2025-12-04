import { StyleSheet, View } from 'react-native';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { memo, useCallback } from 'react';
import { LegendList } from '@legendapp/list';
import { NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PolymarketEventCard,
  HEIGHT as ITEM_HEIGHT,
} from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventCard';

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

  const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;

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
      estimatedItemSize={ITEM_HEIGHT + ITEM_GAP}
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
