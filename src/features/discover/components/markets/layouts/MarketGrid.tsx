import React, { Fragment, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/markets/layouts/CarouselHeader';
import { type DiscoverCardAnalyticsContext } from '@/features/discover/components/surfaceSectionTypes';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { Grid } from '@/screens/token-launcher/components/Grid';

const GRID_COLUMNS = 2;
const GRID_SPACING = 12;
const DEFAULT_SKELETON_ROWS = 2;

type MarketGridProps<T extends PlacementItem> = {
  data: T[];
  headerCount?: number;
  itemHeight: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  renderItem: (item: T, cellWidth: number, analyticsContext: DiscoverCardAnalyticsContext) => ReactNode;
  renderSkeleton: (cellWidth: number) => ReactNode;
  showHeaderCaret?: boolean;
  skeletonCount?: number;
  surfaceId: string;
  title: string;
};

export function MarketGrid<T extends PlacementItem>({
  data,
  headerCount,
  itemHeight,
  leadingAccessory,
  loading,
  onPress,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  showHeaderCaret,
  skeletonCount = GRID_COLUMNS * DEFAULT_SKELETON_ROWS,
  surfaceId,
  title,
}: MarketGridProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const cellWidth = (screenWidth - 2 * GRID_SPACING - (GRID_COLUMNS - 1) * GRID_SPACING) / GRID_COLUMNS;
  const showSkeletons = loading && data.length === 0;

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader count={headerCount} leadingAccessory={leadingAccessory} title={title} onPress={onPress} showCaret={showHeaderCaret} />

      <View style={styles.gridContainer}>
        {showSkeletons ? (
          <Grid columns={GRID_COLUMNS} spacing={GRID_SPACING}>
            {Array.from({ length: skeletonCount }, (_, index) => (
              <View key={index} style={{ height: itemHeight }}>
                <Fragment>{renderSkeleton(cellWidth)}</Fragment>
              </View>
            ))}
          </Grid>
        ) : (
          <Grid columns={GRID_COLUMNS} spacing={GRID_SPACING}>
            {data.map((item, index) => {
              const analyticsContext = getAnalyticsContext({ item, itemIndex: index, placement, placementId, surfaceId, title });

              return (
                <View key={item.id} style={{ height: itemHeight }}>
                  {renderItem(item, cellWidth, analyticsContext)}
                </View>
              );
            })}
          </Grid>
        )}
      </View>
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
    surfaceId,
  };
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: GRID_SPACING,
  },
});
