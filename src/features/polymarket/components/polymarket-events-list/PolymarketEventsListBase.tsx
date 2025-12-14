import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { ComponentProps, ComponentType, ReactElement, memo, useMemo } from 'react';
import { NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PolymarketEventsListItem,
  HEIGHT as ITEM_HEIGHT,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import Skeleton from '@/components/skeleton/Skeleton';
import { useBackgroundColor } from '@/design-system';
import { Grid } from '@/screens/token-launcher/components/Grid';

const ITEM_GAP = 12;
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP;

type ListProps = Pick<ComponentProps<typeof FlatList>, 'onEndReached' | 'onEndReachedThreshold' | 'onRefresh' | 'refreshing'>;

type PolymarketEventsListBaseProps = {
  ListHeaderComponent?: ComponentType | ReactElement | null;
  events: PolymarketEvent[];
  isLoading?: boolean;
  listRef?: React.RefObject<Animated.FlatList<PolymarketEvent> | null>;
  onEndReached?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
} & ListProps;

export const PolymarketEventsListBase = memo(function PolymarketEventsListBase({
  ListHeaderComponent,
  events,
  isLoading,
  listRef,
  onEndReached,
  onEndReachedThreshold,
  onRefresh,
  onScroll,
  refreshing,
}: PolymarketEventsListBaseProps) {
  const safeAreaInsets = useSafeAreaInsets();

  const { contentContainerStyle, scrollIndicatorInsets } = useMemo(() => {
    const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;
    return {
      contentContainerStyle: { minHeight: DEVICE_HEIGHT, paddingBottom, paddingHorizontal: ITEM_GAP / 2 },
      scrollIndicatorInsets: { bottom: paddingBottom },
    };
  }, [safeAreaInsets.bottom]);

  if (isLoading) return <ListLoadingSkeleton />;

  return (
    <Animated.FlatList
      ListEmptyComponent={<ListLoadingSkeleton />}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={contentContainerStyle}
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
      scrollIndicatorInsets={scrollIndicatorInsets}
      style={styles.list}
      windowSize={12}
    />
  );
});

const ListLoadingSkeleton = memo(function ListLoadingSkeleton() {
  const skeletonColor = useBackgroundColor('fillQuaternary');
  const shimmerColor = useBackgroundColor('fillQuaternary');

  return (
    <View style={styles.skeletonContainer}>
      <Grid columns={2} spacing={ITEM_GAP}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.skeletonItemWrapper}>
            <Skeleton skeletonColor={skeletonColor} shimmerColor={shimmerColor}>
              <View style={styles.skeletonCard} />
            </Skeleton>
          </View>
        ))}
      </Grid>
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
    width: (DEVICE_WIDTH - ITEM_GAP * 3) / 2,
  },
  skeletonContainer: {
    marginTop: ITEM_GAP / 2,
    paddingHorizontal: ITEM_GAP / 2,
  },
  skeletonItemWrapper: {
    height: ITEM_HEIGHT,
  },
  skeletonCard: {
    backgroundColor: 'black',
    borderCurve: 'continuous',
    borderRadius: 26,
    height: ITEM_HEIGHT,
  },
});
