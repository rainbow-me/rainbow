import React, { useCallback, useMemo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { Box, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { type Placement, type PlacementItem, type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const CAROUSEL_HORIZONTAL_PADDING = 20;
const CARD_GAP = 8;
const PEEK_WIDTH = 32;
const SKELETON_COUNT = 5;
export const CARD_WIDTH = DEVICE_WIDTH - CAROUSEL_HORIZONTAL_PADDING * 2 - PEEK_WIDTH;
export const CARD_HEIGHT = 100;

type MarketCarouselProps<T extends PlacementItem> = {
  data: T[];
  itemHeight?: number;
  itemWidth?: number;
  getItemWidth?: (item: T) => number;
  keyExtractor: (item: T) => string;
  loading?: boolean;
  onSeeAll: () => void;
  placement?: Placement;
  placementId: Placement['id'];
  // Renderer receives `trackPress` and must invoke it from its inner press
  // handler so every placement gets the same Discover card press analytics
  // event without each renderer wiring its own analytics call.
  renderItem: (item: T, helpers: { trackPress: (metadata?: PlacementItemAnalyticsMetadata) => void }) => ReactElement;
  title: string;
};

export function MarketCarousel<T extends PlacementItem>({
  data,
  getItemWidth,
  itemHeight = CARD_HEIGHT,
  itemWidth = CARD_WIDTH,
  keyExtractor,
  loading,
  onSeeAll,
  placement,
  placementId,
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
    ({ item, index }: { item: T; index: number }) => {
      const trackPress = (metadata?: PlacementItemAnalyticsMetadata) => {
        const marketId = metadata?.marketId ?? item.ref.id;
        const marketName = metadata?.marketName ?? readPlacementItemName(item);
        const marketSymbol = metadata?.marketSymbol ?? readPlacementItemStringMetadata(item, 'symbol');
        const marketSlug = metadata?.marketSlug ?? readPlacementItemStringMetadata(item, 'slug');

        analytics.track(event.discoverPlacementCardPressed, {
          placementId,
          placementScreen: placement?.screen,
          placementTitle: title,
          itemOrder: item.order,
          marketId,
          marketName,
          marketSlug,
          marketSymbol,
          marketType: item.ref.source,
        });
      };
      return <View style={{ width: itemWidths[index] ?? itemWidth }}>{renderItem(item, { trackPress })}</View>;
    },
    [itemWidth, itemWidths, placement, placementId, renderItem, title]
  );

  const handleSeeAllPress = useCallback(() => {
    analytics.track(event.discoverPlacementSeeAllPressed, {
      placementId,
      placementScreen: placement?.screen,
      placementTitle: title,
    });
    onSeeAll();
  }, [onSeeAll, placement, placementId, title]);

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
        <Animated.FlatList
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
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={keyExtractor}
        />
      )}
    </Box>
  );
}

function readPlacementItemName(item: PlacementItem): string | undefined {
  return (
    readPlacementItemStringMetadata(item, 'name') ??
    readPlacementItemStringMetadata(item, 'title') ??
    readPlacementItemStringMetadata(item, 'symbol')
  );
}

function readPlacementItemStringMetadata(item: PlacementItem, key: string): string | undefined {
  const value = item.metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function ItemSeparator() {
  return <View style={styles.separator} />;
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
  separator: {
    width: CARD_GAP,
  },
});
