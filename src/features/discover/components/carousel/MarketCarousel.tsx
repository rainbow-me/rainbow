import React, { Fragment, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';
import { useDebouncedCallback } from 'use-debounce';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { PlacementCardProvider, type TrackPlacementCardPress } from '@/features/discover/components/carousel/placementCardContext';
import {
  defaultPlacementItemKey,
  getPlacementScreen,
  trackPlacementCardPress,
  trackPlacementInteraction,
  trackPlacementSeeAllPress,
} from '@/features/discover/components/placementTracking';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { time } from '@/utils/time';

const CARD_GAP = 8;
const SKELETON_COUNT = 5;
const SCROLL_DEBOUNCE_MS = time.seconds(30);
const SCROLL_DEBOUNCE_OPTIONS = Object.freeze({ leading: false, trailing: true });

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  getItemWidth?: (item: T) => number;
  itemHeight: number;
  itemWidth: number;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: boolean;
  title: string;
};

export function MarketCarousel<T extends PlacementItem>({
  data,
  getItemWidth,
  itemHeight,
  itemWidth,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  showHeaderCaret,
  title,
}: MarketCarouselProps<T>) {
  const placementScreen = getPlacementScreen(placement);
  const showSkeletons = loading && data.length === 0;

  const itemWidths = useMemo(() => (getItemWidth ? data.map(item => getItemWidth(item)) : undefined), [data, getItemWidth]);

  const snapToOffsets = useMemo(() => {
    if (!itemWidths) return undefined;

    let offset = 0;
    return itemWidths.map(width => {
      const currentOffset = offset;
      offset += width + CARD_GAP;
      return currentOffset;
    });
  }, [itemWidths]);

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const trackPress: TrackPlacementCardPress = metadata =>
        trackPlacementCardPress({
          item,
          metadata,
          placementId,
          placementScreen,
          title,
        });

      return (
        <View style={{ height: itemHeight, overflow: 'visible', width: itemWidths?.[index] ?? itemWidth }}>
          <PlacementCardProvider value={trackPress}>{renderItem(item)}</PlacementCardProvider>
        </View>
      );
    },
    [itemHeight, itemWidth, itemWidths, placementId, placementScreen, renderItem, title]
  );

  const handleSeeAllPress = useCallback(() => {
    trackPlacementSeeAllPress({ placementId, placementScreen, title });
    onPressSeeAll?.();
  }, [onPressSeeAll, placementId, placementScreen, title]);

  const onScrollSettle = useDebouncedCallback(
    () => {
      if (!placement) return;
      trackPlacementInteraction({ interactionType: 'carousel_scroll', placement });
    },
    SCROLL_DEBOUNCE_MS,
    SCROLL_DEBOUNCE_OPTIONS
  );

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={onPressSeeAll ? handleSeeAllPress : undefined} showCaret={showHeaderCaret} />

      {showSkeletons ? (
        <View style={styles.skeletonRow}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Fragment key={index}>{renderSkeleton()}</Fragment>
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          horizontal
          disallowInterruption
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          decelerationRate="fast"
          snapToInterval={snapToOffsets ? undefined : itemWidth + CARD_GAP}
          snapToOffsets={snapToOffsets}
          snapToAlignment="start"
          renderItem={renderCarouselItem}
          keyExtractor={defaultPlacementItemKey}
          onMomentumScrollEnd={onScrollSettle}
          initialNumToRender={6}
          windowSize={8}
        />
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: CARD_GAP,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
});
