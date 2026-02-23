import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { type ComponentProps, type ComponentType, type ReactElement, type RefObject, memo, useMemo } from 'react';
import { NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PolymarketEventsListItem,
  HEIGHT as ITEM_HEIGHT,
  LoadingSkeleton,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

const ITEM_GAP = 12;
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP;
const ITEM_WIDTH = (DEVICE_WIDTH - ITEM_GAP * 3) / 2;

type ListProps = Pick<ComponentProps<typeof FlatList>, 'onEndReached' | 'onEndReachedThreshold' | 'onRefresh' | 'refreshing'>;

type PolymarketEventsListBaseProps = {
  ListHeaderComponent?: ComponentType | ReactElement | null;
  events: PolymarketEvent[];
  listRef?: RefObject<Animated.FlatList<unknown> | null>;
  onEndReached?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
} & ListProps;

export const PolymarketEventsListBase = memo(function PolymarketEventsListBase({
  ListHeaderComponent,
  events,
  listRef,
  onEndReached,
  onEndReachedThreshold,
  onRefresh,
  onScroll,
  refreshing,
}: PolymarketEventsListBaseProps) {
  const safeAreaInsets = useSafeAreaInsets();

  const listStyles = useMemo(() => {
    const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;
    return {
      contentContainerStyle: { minHeight: DEVICE_HEIGHT, paddingBottom, paddingHorizontal: ITEM_GAP / 2, paddingTop: ITEM_GAP },
      scrollIndicatorInsets: { bottom: paddingBottom },
    };
  }, [safeAreaInsets.bottom]);

  return (
    <Animated.FlatList
      ListEmptyComponent={<ListLoadingSkeleton />}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={listStyles.contentContainerStyle}
      data={events}
      getItemLayout={getItemLayout}
      initialNumToRender={6}
      keyExtractor={keyExtractor}
      maxToRenderPerBatch={6}
      numColumns={2}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onRefresh={onRefresh}
      onScroll={onScroll}
      ref={listRef}
      refreshing={refreshing}
      renderItem={renderItem}
      scrollIndicatorInsets={listStyles.scrollIndicatorInsets}
      style={styles.list}
      windowSize={12}
    />
  );
});

const ListLoadingSkeleton = memo(function ListLoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.skeletonItemWrapper}>
          <LoadingSkeleton />
        </View>
      ))}
    </View>
  );
});

function getItemLayout(data: unknown, index: number) {
  return {
    length: ITEM_HEIGHT,
    offset: Math.floor(index / 2) * ROW_HEIGHT,
    index,
  };
}

function keyExtractor(item: PolymarketEvent): string {
  return item ? item.id : '';
}

function renderItem({ item }: { item: PolymarketEvent }) {
  return item ? <PolymarketEventsListItem event={item} style={styles.itemWrapper} /> : null;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listFooter: {
    height: safeAreaInsetValues.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE,
  },
  itemWrapper: {
    margin: ITEM_GAP / 2,
    width: ITEM_WIDTH,
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skeletonItemWrapper: {
    height: ITEM_HEIGHT,
    width: ITEM_WIDTH,
    margin: ITEM_GAP / 2,
  },
  skeletonCard: {
    backgroundColor: 'black',
    borderCurve: 'continuous',
    borderRadius: 26,
    height: ITEM_HEIGHT,
  },
});
