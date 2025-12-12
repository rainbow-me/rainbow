import { FlatList, StyleSheet, View } from 'react-native';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { memo, useCallback, ComponentProps } from 'react';
import { NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PolymarketEventsListItem,
  HEIGHT as ITEM_HEIGHT,
  LoadingSkeleton,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { Grid } from '@/screens/token-launcher/components/Grid';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const ITEM_GAP = 12;
const PADDING_HORIZONTAL = 12;
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP;
const ITEM_WIDTH = (DEVICE_WIDTH - PADDING_HORIZONTAL * 2 - ITEM_GAP) / 2;

type ListProps = Pick<ComponentProps<typeof FlatList>, 'onEndReached' | 'onEndReachedThreshold' | 'onRefresh' | 'refreshing' | 'onRefresh'>;

type PolymarketEventsListBaseProps = {
  events: PolymarketEvent[];
  isLoading?: boolean;
  listRef?: React.RefObject<FlatList<PolymarketEvent> | null>;
} & ListProps;

export const PolymarketEventsListBase = memo(function PolymarketEventsListBase({
  events,
  isLoading,
  listRef,
  ...listProps
}: PolymarketEventsListBaseProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;

  const renderItem = useCallback(({ item }: { item: PolymarketEvent }) => {
    return (
      <View style={styles.itemWrapper}>
        <PolymarketEventsListItem event={item} />
      </View>
    );
  }, []);

  if (isLoading) {
    return <ListLoadingSkeleton />;
  }

  return (
    <FlatList
      data={events}
      numColumns={2}
      ref={listRef}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[styles.contentContainer, { paddingBottom }]}
      columnWrapperStyle={styles.columnWrapper}
      scrollIndicatorInsets={{ bottom: paddingBottom }}
      style={styles.list}
      getItemLayout={getItemLayout}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...listProps}
    />
  );
});

function keyExtractor(item: PolymarketEvent): string {
  return item.id;
}

function getItemLayout(_: unknown, index: number) {
  return {
    length: ITEM_HEIGHT,
    offset: Math.floor(index / 2) * ROW_HEIGHT,
    index,
  };
}

const ListLoadingSkeleton = memo(function ListLoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <Grid columns={2} spacing={ITEM_GAP}>
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </Grid>
    </View>
  );
});

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    gap: ITEM_GAP,
    // ITEM_GAP / 2 is added because LegendList does not account for row gap for calculating available item width.
    // paddingHorizontal: ITEM_GAP / 2 + PADDING_HORIZONTAL,
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  columnWrapper: {
    gap: ITEM_GAP,
  },
  itemWrapper: {
    width: ITEM_WIDTH,
  },
  skeletonContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
  },
});
