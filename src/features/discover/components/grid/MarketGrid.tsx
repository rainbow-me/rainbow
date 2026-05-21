import React, { Fragment, useCallback, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { PlacementCardProvider, type TrackPlacementCardPress } from '@/features/discover/components/carousel/placementCardContext';
import { getPlacementScreen, trackPlacementCardPress, trackPlacementSeeAllPress } from '@/features/discover/components/placementTracking';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { Grid } from '@/screens/token-launcher/components/Grid';

const DEFAULT_COLUMNS = 2;
const DEFAULT_SKELETON_ROWS = 2;

type MarketGridProps<T extends PlacementItem> = {
  columns?: number;
  data: T[];
  itemHeight: number;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId;
  renderItem: (item: T, cellWidth: number) => ReactNode;
  renderSkeleton: (cellWidth: number) => ReactNode;
  spacing?: number;
  title: string;
};

export function MarketGrid<T extends PlacementItem>({
  columns = DEFAULT_COLUMNS,
  data,
  itemHeight,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  spacing = SCREEN_HORIZONTAL_PADDING,
  title,
}: MarketGridProps<T>) {
  const placementScreen = getPlacementScreen(placement);
  const { width: screenWidth } = useWindowDimensions();
  const cellWidth = (screenWidth - 2 * SCREEN_HORIZONTAL_PADDING - (columns - 1) * spacing) / columns;
  const showSkeletons = loading && data.length === 0;

  const handleSeeAllPress = useCallback(() => {
    trackPlacementSeeAllPress({ placementId, placementScreen, title });
    onPressSeeAll?.();
  }, [onPressSeeAll, placementId, placementScreen, title]);

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={onPressSeeAll ? handleSeeAllPress : undefined} />

      <View style={styles.gridContainer}>
        {showSkeletons ? (
          <Grid columns={columns} spacing={spacing}>
            {Array.from({ length: columns * DEFAULT_SKELETON_ROWS }, (_, index) => (
              <View key={index} style={{ height: itemHeight }}>
                <Fragment>{renderSkeleton(cellWidth)}</Fragment>
              </View>
            ))}
          </Grid>
        ) : (
          <Grid columns={columns} spacing={spacing}>
            {data.map(item => {
              const trackPress: TrackPlacementCardPress = metadata =>
                trackPlacementCardPress({
                  item,
                  metadata,
                  placementId,
                  placementScreen,
                  title,
                });

              return (
                <View key={`${item.ref.source}:${item.ref.id}`} style={{ height: itemHeight }}>
                  <PlacementCardProvider value={trackPress}>{renderItem(item, cellWidth)}</PlacementCardProvider>
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
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
});
