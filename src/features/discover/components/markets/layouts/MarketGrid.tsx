import React, { Fragment, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/markets/layouts/CarouselHeader';
import { PlacementTrackedItem } from '@/features/discover/components/markets/PlacementTrackedItem';
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
  renderItem: (item: T, cellWidth: number) => ReactNode;
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
              return (
                <View key={item.id} style={{ height: itemHeight }}>
                  <PlacementTrackedItem
                    item={item}
                    itemIndex={index}
                    placement={placement}
                    placementId={placementId}
                    surfaceId={surfaceId}
                    title={title}
                  >
                    {renderItem(item, cellWidth)}
                  </PlacementTrackedItem>
                </View>
              );
            })}
          </Grid>
        )}
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: GRID_SPACING,
  },
});
