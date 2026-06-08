import React, { Fragment, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';

import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type PlacementItem } from '@/features/placements/types';

import { computeSnapToOffsets } from './carouselLayout';

const HORIZONTAL_PADDING = 12;
const CARD_GAP = HORIZONTAL_PADDING;

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
  renderItem: (item: T, width: number) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: boolean;
  singleItemWidth?: number;
  skeletonCount?: number;
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
  renderItem,
  renderSkeleton,
  showHeaderCaret,
  singleItemWidth,
  skeletonCount = 5,
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
          {renderItem(item, width)}
        </View>
      );
    },
    [defaultItemWidth, itemHeight, itemVerticalBleed, itemWidths, renderItem]
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
