import React, { useCallback, useMemo, type ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { useDebouncedCallback } from 'use-debounce';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { Box, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { time } from '@/utils/time';

const CAROUSEL_HORIZONTAL_PADDING = 20;
const CARD_GAP = 8;
const PEEK_WIDTH = 32;
const SKELETON_COUNT = 5;
const SCROLL_DEBOUNCE_MS = time.seconds(30);
export const CARD_WIDTH = DEVICE_WIDTH - CAROUSEL_HORIZONTAL_PADDING * 2 - PEEK_WIDTH;
export const CARD_HEIGHT = 100;

type FeaturedCarouselType = 'perps' | 'predictions';
type FeaturedCarouselProvider = 'hyperliquid' | 'polymarket';

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  itemHeight?: number;
  itemWidth?: number;
  getItemWidth?: (item: T) => number;
  loading?: boolean;
  onPressSeeAll: () => void;
  placement?: Placement;
  placementId: Placement['id'];
  provider: FeaturedCarouselProvider;
  type: FeaturedCarouselType;
  renderItem: (item: T) => ReactElement;
  title: string;
};

function keyExtractor<T extends PlacementItem>(item: T): string {
  return `${item.ref.source}:${item.ref.id}`;
}

export function MarketCarousel<T extends PlacementItem>({
  data,
  getItemWidth,
  itemHeight = CARD_HEIGHT,
  itemWidth = CARD_WIDTH,
  loading,
  onPressSeeAll,
  placementId,
  provider,
  type,
  renderItem,
  title,
}: MarketCarouselProps<T>) {
  const itemWidths = useMemo(() => data.map(item => getItemWidth?.(item) ?? itemWidth), [data, getItemWidth, itemWidth]);
  const snapToOffsets = useMemo(() => {
    if (!getItemWidth) return undefined;

    let offset = 0;
    return itemWidths.map(width => {
      const currentOffset = offset;
      offset += width + CARD_GAP;
      return currentOffset;
    });
  }, [getItemWidth, itemWidths]);

  const renderFlatListItem = useCallback(
    ({ item, index }: { item: T; index: number }) => <View style={{ width: itemWidths[index] ?? itemWidth }}>{renderItem(item)}</View>,
    [itemWidth, itemWidths, renderItem]
  );

  const handleSeeAllPress = useCallback(() => {
    analytics.track(event.discoverFeaturedCarouselSeeAllPressed, {
      placementId,
      type,
      provider,
    });
    onPressSeeAll();
  }, [onPressSeeAll, placementId, provider, type]);

  const handleScrollSettle = useDebouncedCallback(
    () => {
      analytics.track(event.discoverFeaturedCarouselScrolled, {
        placementId,
        type,
        provider,
      });
    },
    SCROLL_DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  if (!loading && data.length === 0) return null;

  return (
    <Box gap={12}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingHorizontal="4px">
        <Text size="22pt" weight="heavy" color="label">
          {title}
        </Text>

        <ButtonPressAnimation onPress={handleSeeAllPress} scaleTo={0.9}>
          <Box flexDirection="row" alignItems="center" gap={4} paddingVertical="8px">
            <Text size="15pt" weight="heavy" color="labelQuaternary">
              {i18n.t(i18n.l.discover.placements.see_all)}
            </Text>
            <TextIcon size="icon 11px" weight="heavy" color="labelQuaternary">
              {'􀄯'}
            </TextIcon>
          </Box>
        </ButtonPressAnimation>
      </Box>

      {loading ? (
        <View style={styles.skeletonRow}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <CarouselSkeleton key={index} itemHeight={itemHeight} itemWidth={itemWidth} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          style={styles.flatList}
          decelerationRate="fast"
          snapToInterval={snapToOffsets ? undefined : itemWidth + CARD_GAP}
          snapToOffsets={snapToOffsets}
          snapToAlignment="start"
          renderItem={renderFlatListItem}
          keyExtractor={keyExtractor}
          onMomentumScrollEnd={handleScrollSettle}
        />
      )}
    </Box>
  );
}

function CarouselSkeleton({ itemHeight, itemWidth }: { itemHeight: number; itemWidth: number }) {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, 0.1);
  const skeletonColor = isDarkMode ? fillQuaternary : fillSecondary;

  return (
    <View style={[styles.skeleton, { backgroundColor: skeletonColor, height: itemHeight, width: itemWidth }]}>
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: CARD_GAP,
    paddingHorizontal: CAROUSEL_HORIZONTAL_PADDING,
  },
  flatList: {
    marginHorizontal: -CAROUSEL_HORIZONTAL_PADDING,
    overflow: 'visible',
  },
  skeleton: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: 0,
  },
});
