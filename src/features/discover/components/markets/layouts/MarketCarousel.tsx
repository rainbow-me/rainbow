import React, { Fragment, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';
import { useDebouncedCallback } from 'use-debounce';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type CardPressHandler, type CarouselSectionDescriptor, type OrderPressHandler } from '@/features/discover/types/sectionLayout';
import { trackPlacementInteraction, trackSurfaceInteraction } from '@/features/placements/engagement/trackInteraction';
import { type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { placementType } from '@/features/placements/utils/placementType';
import { time } from '@/framework/core/utils/time';

import { computeSnapToOffsets } from './carouselLayout';

const HORIZONTAL_PADDING = 12;
const CARD_GAP = HORIZONTAL_PADDING;
const SCROLL_DEBOUNCE_MS = time.ms(500);
const SCROLL_DEBOUNCE_OPTIONS = Object.freeze({ leading: false, trailing: true });

function noopPress(): undefined {
  return undefined;
}

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  getItemWidth?: (item: T) => number;
  headerCount?: number;
  itemHorizontalBleed?: number;
  itemHeight: number;
  itemVerticalBleed?: number;
  itemWidth: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  placement?: Placement;
  renderItem: CarouselSectionDescriptor<T>['renderItem'];
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: boolean;
  singleItemWidth?: number;
  skeletonCount?: number;
  section: SurfaceLeafNode;
  surfaceId: SurfaceId;
  title: string;
};

export function MarketCarousel<T extends PlacementItem>({
  data,
  getItemWidth,
  headerCount,
  itemHorizontalBleed = 0,
  itemHeight,
  itemVerticalBleed = 0,
  itemWidth,
  leadingAccessory,
  loading,
  onPress,
  placement,
  renderItem,
  renderSkeleton,
  section,
  showHeaderCaret,
  singleItemWidth,
  skeletonCount = 5,
  surfaceId,
  title,
}: MarketCarouselProps<T>) {
  const showSkeletons = loading && data.length === 0;
  const defaultItemWidth = data.length === 1 && singleItemWidth !== undefined ? singleItemWidth : itemWidth;

  const itemWidths = useMemo(
    () => data.map(item => (getItemWidth ? getItemWidth(item) : defaultItemWidth)),
    [data, defaultItemWidth, getItemWidth]
  );

  const snapToOffsets = useMemo(() => computeSnapToOffsets(itemWidths, CARD_GAP), [itemWidths]);

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const onCardPress: CardPressHandler = placement
        ? metadata => {
            const derivedPlacementType = placementType(placement.source);

            analytics.track(event.discoverCardPressed, {
              placementId: placement.id,
              placementSource: placement.source,
              placementTitle: title,
              itemOrder: index,
              itemId: item.id,
              marketId: metadata.marketId,
              marketName: metadata.marketName,
              marketSlug: metadata.marketSlug,
              marketSymbol: metadata.marketSymbol,
              marketType: derivedPlacementType,
            });
            trackPlacementInteraction({
              display: section.display,
              id: placement.id,
              interactionType: 'card_press',
              itemId: item.id,
              itemOrder: index,
              sectionId: section.id,
              sectionTitle: title,
              source: placement.source,
              surfaceId,
              type: derivedPlacementType,
              version: placement.version,
            });
          }
        : noopPress;
      const onOrderPress: OrderPressHandler = placement
        ? order => {
            analytics.track(event.discoverPredictionOrderPressed, {
              placementId: placement.id,
              itemId: item.id,
              marketId: order.marketId,
              marketName: order.marketName,
              marketSlug: order.marketSlug,
              outcome: order.outcome,
            });
          }
        : noopPress;
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
          {renderItem(item, width, onCardPress, onOrderPress)}
        </View>
      );
    },
    [defaultItemWidth, itemHeight, itemVerticalBleed, itemWidths, placement, renderItem, section.display, section.id, surfaceId, title]
  );

  const onScrollSettle = useDebouncedCallback(
    () => {
      analytics.track(event.discoverCarouselScrolled, {
        display: section.display,
        sectionId: section.id,
      });

      trackSurfaceInteraction({
        display: section.display,
        id: surfaceId,
        sectionId: section.id,
        sectionTitle: title,
      });
    },
    SCROLL_DEBOUNCE_MS,
    SCROLL_DEBOUNCE_OPTIONS
  );

  useEffect(() => () => onScrollSettle.flush(), [onScrollSettle]);

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
        <View
          style={[
            styles.carouselViewport,
            itemHorizontalBleed ? { marginHorizontal: HORIZONTAL_PADDING - itemHorizontalBleed } : undefined,
            itemVerticalBleed ? { marginVertical: -itemVerticalBleed } : undefined,
          ]}
        >
          <FlatList
            data={data}
            horizontal
            disallowInterruption
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.contentContainer, itemHorizontalBleed ? { paddingHorizontal: itemHorizontalBleed } : undefined]}
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
