import React, { Fragment, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';
import { useDebouncedCallback } from 'use-debounce';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import {
  trackPlacementInteraction,
  trackSurfaceSectionDrilldownPress,
} from '@/features/discover/components/marketPress/marketPressContext';
import { PlacementTrackedItem } from '@/features/discover/components/PlacementTrackedItem';
import { type Destination, type Display } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { time } from '@/utils/time';

const CARD_GAP = 8;
const HORIZONTAL_PADDING = 12;
const SKELETON_COUNT = 5;
const SCROLL_DEBOUNCE_MS = time.seconds(30);
const SCROLL_DEBOUNCE_OPTIONS = Object.freeze({ leading: false, trailing: true });

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  destination: Destination;
  display: Display;
  getItemWidth?: (item: T) => number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  sectionId: string;
  showHeaderCaret?: boolean;
  surfaceId: string;
  title: string;
};

export function MarketCarousel<T extends PlacementItem>({
  data,
  destination,
  display,
  getItemWidth,
  itemHeight,
  itemVerticalBleed = 0,
  itemWidth,
  leadingAccessory,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  sectionId,
  showHeaderCaret,
  surfaceId,
  title,
}: MarketCarouselProps<T>) {
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
      return (
        <View
          style={{
            height: itemHeight + itemVerticalBleed * 2,
            justifyContent: 'center',
            overflow: 'visible',
            width: itemWidths?.[index] ?? itemWidth,
          }}
        >
          <PlacementTrackedItem
            item={item}
            itemIndex={index}
            placement={placement}
            placementId={placementId}
            surfaceId={surfaceId}
            title={title}
          >
            {renderItem(item)}
          </PlacementTrackedItem>
        </View>
      );
    },
    [itemHeight, itemVerticalBleed, itemWidth, itemWidths, placement, placementId, renderItem, surfaceId, title]
  );

  const handleSeeAllPress = useCallback(() => {
    trackSurfaceSectionDrilldownPress({ destination, display, placement, placementId, sectionId, surfaceId, title });
    onPressSeeAll?.();
  }, [destination, display, onPressSeeAll, placement, placementId, sectionId, surfaceId, title]);

  const onScrollSettle = useDebouncedCallback(
    () => {
      if (!placement) return;
      trackPlacementInteraction({ display, interactionType: 'carousel_scroll', placement, sectionId, surfaceId });
    },
    SCROLL_DEBOUNCE_MS,
    SCROLL_DEBOUNCE_OPTIONS
  );

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader
        leadingAccessory={leadingAccessory}
        title={title}
        onPress={onPressSeeAll ? handleSeeAllPress : undefined}
        showCaret={showHeaderCaret}
      />

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
          style={itemVerticalBleed ? { marginVertical: -itemVerticalBleed } : undefined}
          snapToInterval={snapToOffsets ? undefined : itemWidth + CARD_GAP}
          snapToOffsets={snapToOffsets}
          snapToAlignment="start"
          renderItem={renderCarouselItem}
          keyExtractor={item => item.id}
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
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
});
