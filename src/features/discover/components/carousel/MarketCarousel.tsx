import React, { Fragment, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';
import { useDebouncedCallback } from 'use-debounce';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import {
  trackPlacementInteraction,
  trackSurfaceInteraction,
  trackSurfaceSectionDrilldownPress,
} from '@/features/discover/components/marketPress/marketPressContext';
import { PlacementTrackedItem } from '@/features/discover/components/PlacementTrackedItem';
import { type Destination, type Display } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { time } from '@/utils/time';

const HORIZONTAL_PADDING = 12;
const CARD_GAP = HORIZONTAL_PADDING;
const SKELETON_COUNT = 5;
const SCROLL_DEBOUNCE_MS = time.seconds(30);
const SCROLL_DEBOUNCE_OPTIONS = Object.freeze({ leading: false, trailing: true });

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  destination: Destination;
  display: Display;
  getItemWidth?: (item: T) => number;
  headerCount?: number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  sectionId: string;
  showHeaderCaret?: boolean;
  skeletonCount?: number;
  surfaceId: string;
  title: string;
};

export function MarketCarousel<T extends PlacementItem>({
  data,
  destination,
  display,
  getItemWidth,
  headerCount,
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
  skeletonCount = SKELETON_COUNT,
  surfaceId,
  title,
}: MarketCarouselProps<T>) {
  const showSkeletons = loading && data.length === 0;

  const itemWidths = useMemo(() => data.map(item => (getItemWidth ? getItemWidth(item) : itemWidth)), [data, getItemWidth, itemWidth]);

  const snapToOffsets = useMemo(() => {
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
      trackSurfaceInteraction({ display, interactionType: 'carousel_scroll', placement, sectionId, surfaceId });
      if (placement) trackPlacementInteraction({ interactionType: 'carousel_scroll', placement, surfaceId });
    },
    SCROLL_DEBOUNCE_MS,
    SCROLL_DEBOUNCE_OPTIONS
  );

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader
        count={headerCount}
        leadingAccessory={leadingAccessory}
        title={title}
        onPress={onPressSeeAll ? handleSeeAllPress : undefined}
        showCaret={showHeaderCaret}
      />

      {showSkeletons ? (
        <View style={styles.skeletonRow}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <Fragment key={index}>{renderSkeleton()}</Fragment>
          ))}
        </View>
      ) : (
        <View style={[styles.carouselViewport, itemVerticalBleed ? { marginVertical: -itemVerticalBleed } : undefined]}>
          <FlatList
            data={data}
            horizontal
            disallowInterruption
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            decelerationRate="fast"
            snapToOffsets={snapToOffsets}
            snapToAlignment="start"
            renderItem={renderCarouselItem}
            keyExtractor={item => item.id}
            onMomentumScrollEnd={onScrollSettle}
            initialNumToRender={6}
            windowSize={8}
          />
        </View>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  carouselViewport: {
    marginHorizontal: HORIZONTAL_PADDING,
    overflow: 'hidden',
  },
  contentContainer: {
    gap: CARD_GAP,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
});
