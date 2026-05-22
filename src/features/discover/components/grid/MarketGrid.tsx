import React, { Fragment, useCallback, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import {
  PlacementCardProvider,
  PlacementPredictionOutcomeProvider,
  type TrackPlacementCardPress,
  type TrackPredictionOutcomePress,
} from '@/features/discover/components/carousel/placementCardContext';
import {
  trackPlacementCardPress,
  trackPlacementSeeAllPress,
  trackPredictionOutcomePress,
} from '@/features/discover/components/placementTracking';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { type Destination } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { Grid } from '@/screens/token-launcher/components/Grid';

const DEFAULT_COLUMNS = 2;
const DEFAULT_SKELETON_ROWS = 2;

type MarketGridProps<T extends PlacementItem> = {
  columns?: number;
  data: T[];
  destination: Destination;
  itemHeight: number;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId;
  renderItem: (item: T, cellWidth: number) => ReactNode;
  renderSkeleton: (cellWidth: number) => ReactNode;
  showHeaderCaret?: boolean;
  spacing?: number;
  surfaceId: string;
  title: string;
};

export function MarketGrid<T extends PlacementItem>({
  columns = DEFAULT_COLUMNS,
  data,
  destination,
  itemHeight,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  showHeaderCaret,
  spacing = SCREEN_HORIZONTAL_PADDING,
  surfaceId,
  title,
}: MarketGridProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const cellWidth = (screenWidth - 2 * SCREEN_HORIZONTAL_PADDING - (columns - 1) * spacing) / columns;
  const showSkeletons = loading && data.length === 0;

  const handleSeeAllPress = useCallback(() => {
    trackPlacementSeeAllPress({ destination, placementId, surfaceId, title });
    onPressSeeAll?.();
  }, [destination, onPressSeeAll, placementId, surfaceId, title]);

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={onPressSeeAll ? handleSeeAllPress : undefined} showCaret={showHeaderCaret} />

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
            {data.map((item, index) => {
              const trackPress: TrackPlacementCardPress = metadata =>
                trackPlacementCardPress({
                  item,
                  itemIndex: index,
                  metadata,
                  placement,
                  placementId,
                  surfaceId,
                  title,
                });
              const trackOutcomePress: TrackPredictionOutcomePress = metadata =>
                trackPredictionOutcomePress({
                  item,
                  metadata,
                  placementId,
                  surfaceId,
                });

              return (
                <View key={item.id} style={{ height: itemHeight }}>
                  <PlacementCardProvider value={trackPress}>
                    <PlacementPredictionOutcomeProvider value={trackOutcomePress}>
                      {renderItem(item, cellWidth)}
                    </PlacementPredictionOutcomeProvider>
                  </PlacementCardProvider>
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
