import { FlatList, StyleSheet, View } from 'react-native';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { memo, useCallback } from 'react';
// import { LegendList } from '@legendapp/list';
import { NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PolymarketEventCard,
  HEIGHT as ITEM_HEIGHT,
} from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventCard';
import Skeleton from '@/components/skeleton/Skeleton';
import { useBackgroundColor } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';
import { Grid } from '@/screens/token-launcher/components/Grid';

const ITEM_GAP = 12;
const PADDING_HORIZONTAL = 12;
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP;
const CARD_BORDER_RADIUS = 26;

function LoadingSkeleton() {
  const skeletonColor = useBackgroundColor('fillQuaternary');
  const shimmerColor = opacity(useBackgroundColor('fillSecondary'), 0.1);

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
}

export const PolymarketEventsList = memo(function PolymarketEventsList() {
  const safeAreaInsets = useSafeAreaInsets();
  const isInitialLoad = usePolymarketEventsStore(state => state.getStatus('isInitialLoad'));
  const events = usePolymarketEventsStore(state => state.getData());

  const renderItem = useCallback(({ item }: { item: PolymarketEvent }) => {
    return (
      <View style={styles.itemWrapper}>
        <PolymarketEventCard event={item} />
      </View>
    );
  }, []);

  const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;

  if (isInitialLoad) {
    return <LoadingSkeleton />;
  }

  return (
    <FlatList
      data={events ?? []}
      numColumns={2}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[styles.contentContainer, { paddingBottom }]}
      columnWrapperStyle={styles.columnWrapper}
      scrollIndicatorInsets={{ bottom: paddingBottom }}
      style={styles.list}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: Math.floor(index / 2) * ROW_HEIGHT,
        index,
      })}
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );

  // Weird behavior when using LegendList with numColumns
  // return (
  //   <LegendList
  //     data={events ?? []}
  //     numColumns={2}
  //     renderItem={renderItem}
  //     keyExtractor={keyExtractor}
  //     contentContainerStyle={[styles.contentContainer, { paddingBottom }]}
  //     columnWrapperStyle={styles.columnWrapper}
  //     scrollIndicatorInsets={{ bottom: paddingBottom }}
  //     style={styles.list}
  //     estimatedItemSize={ITEM_HEIGHT + ITEM_GAP}
  //   />
  // );
});

function keyExtractor(item: PolymarketEvent): string {
  return item.id;
}

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
    flex: 1,
  },
  skeletonContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  skeletonItemWrapper: {
    height: ITEM_HEIGHT,
  },
  skeletonCard: {
    height: ITEM_HEIGHT,
    borderRadius: CARD_BORDER_RADIUS,
    backgroundColor: 'black',
  },
});
