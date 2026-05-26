import React, { Fragment, useCallback, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { trackSurfaceSectionPress } from '@/features/discover/components/marketPress/marketPressContext';
import { PlacementTrackedItem } from '@/features/discover/components/PlacementTrackedItem';
import { type Destination, type Display } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { Grid } from '@/screens/token-launcher/components/Grid';

const GRID_COLUMNS = 2;
const GRID_SPACING = 12;
const DEFAULT_SKELETON_ROWS = 2;

type MarketGridProps<T extends PlacementItem> = {
  data: T[];
  destination: Destination;
  display: Display;
  headerCount?: number;
  itemHeight: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  renderItem: (item: T, cellWidth: number) => ReactNode;
  renderSkeleton: (cellWidth: number) => ReactNode;
  sectionId: string;
  showHeaderCaret?: boolean;
  skeletonCount?: number;
  surfaceId: string;
  title: string;
};

export function MarketGrid<T extends PlacementItem>({
  data,
  destination,
  display,
  headerCount,
  itemHeight,
  leadingAccessory,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  sectionId,
  showHeaderCaret,
  skeletonCount = GRID_COLUMNS * DEFAULT_SKELETON_ROWS,
  surfaceId,
  title,
}: MarketGridProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const cellWidth = (screenWidth - 2 * GRID_SPACING - (GRID_COLUMNS - 1) * GRID_SPACING) / GRID_COLUMNS;
  const showSkeletons = loading && data.length === 0;

  const handleSeeAllPress = useCallback(() => {
    trackSurfaceSectionPress({ destination, display, placement, placementId, sectionId, surfaceId, title });
    onPressSeeAll?.();
  }, [destination, display, onPressSeeAll, placement, placementId, sectionId, surfaceId, title]);

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
