import React, { Fragment, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';
import { useDebouncedCallback } from 'use-debounce';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type DiscoverCardAnalyticsContext } from '@/features/discover/components/surfaceSectionTypes';
import { type Display } from '@/features/placements/surfaces/types';
import {
  type PlacementV2 as Placement,
  type PlacementIdV2 as PlacementId,
  type PlacementItemV2 as PlacementItem,
} from '@/features/placements/types';
import { time } from '@/framework/core/utils/time';

const HORIZONTAL_PADDING = 12;
const CARD_GAP = HORIZONTAL_PADDING;
const SKELETON_COUNT = 5;
const SCROLL_DEBOUNCE_MS = time.seconds(30);
const SCROLL_DEBOUNCE_OPTIONS = Object.freeze({ leading: false, trailing: true });

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  display: Display;
  getItemWidth?: (item: T) => number;
  headerCount?: number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  renderItem: (item: T, width: number, analyticsContext: DiscoverCardAnalyticsContext) => ReactNode;
  renderSkeleton: () => ReactNode;
  sectionId: string;
  showHeaderCaret?: boolean;
  singleItemWidth?: number;
  skeletonCount?: number;
  surfaceId: string;
  title: string;
};

export function MarketCarousel<T extends PlacementItem>({
  data,
  display,
  getItemWidth,
  headerCount,
  itemHeight,
  itemVerticalBleed = 0,
  itemWidth,
  leadingAccessory,
  loading,
  onPress,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  sectionId,
  showHeaderCaret,
  singleItemWidth,
  skeletonCount = SKELETON_COUNT,
  surfaceId,
  title,
}: MarketCarouselProps<T>) {
  const showSkeletons = loading && data.length === 0;
  const defaultItemWidth = data.length === 1 && singleItemWidth !== undefined ? singleItemWidth : itemWidth;

  const itemWidths = useMemo(
    () => data.map(item => (getItemWidth ? getItemWidth(item) : defaultItemWidth)),
    [data, defaultItemWidth, getItemWidth]
  );

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
      const analyticsContext = getAnalyticsContext({ item, itemIndex: index, placement, placementId, surfaceId, title });
      const width = itemWidths[index] ?? defaultItemWidth;

      return (
        <View
          style={{
            height: itemHeight + itemVerticalBleed * 2,
            justifyContent: 'center',
            overflow: 'visible',
            width,
          }}
        >
          {renderItem(item, width, analyticsContext)}
        </View>
      );
    },
    [defaultItemWidth, itemHeight, itemVerticalBleed, itemWidths, placement, placementId, renderItem, surfaceId, title]
  );

  const onScrollSettle = useDebouncedCallback(
    () => {
      analytics.track(event.discoverCarouselScrolled, {
        display,
        placementId: placement?.id,
        placementSource: placement?.source,
        placementType: placement?.type,
        placementVersion: placement?.version,
        sectionId,
        surfaceId,
      });

      analytics.track(event.surfaceInteraction, {
        display,
        placementId: placement?.id,
        placementSource: placement?.source,
        placementType: placement?.type,
        sectionId,
        surfaceId,
      });
    },
    SCROLL_DEBOUNCE_MS,
    SCROLL_DEBOUNCE_OPTIONS
  );

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <SectionHeader count={headerCount} leadingAccessory={leadingAccessory} title={title} onPress={onPress} showCaret={showHeaderCaret} />

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

function getAnalyticsContext<T extends PlacementItem>({
  item,
  itemIndex,
  placement,
  placementId,
  surfaceId,
  title,
}: {
  item: T;
  itemIndex: number;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  surfaceId: string;
  title: string;
}): DiscoverCardAnalyticsContext {
  return {
    itemId: item.id,
    itemOrder: itemIndex,
    placementId,
    placementSource: placement?.source,
    placementTitle: title,
    placementType: placement?.type,
    surfaceId,
  };
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
