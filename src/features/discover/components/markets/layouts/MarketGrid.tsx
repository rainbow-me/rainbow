import React, { type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type CardPressHandler, type GridSectionDescriptor, type OrderPressHandler } from '@/features/discover/types/sectionLayout';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { Grid } from '@/screens/token-launcher/components/Grid';

const GRID_COLUMNS = 2;
const GRID_SPACING = 12;

function noopCardPress(): undefined {
  return undefined;
}

function noopOrderPress(): undefined {
  return undefined;
}

type MarketGridProps<T extends PlacementItem> = {
  data: T[];
  headerCount?: number;
  itemHeight: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  placement?: Placement;
  renderItem: GridSectionDescriptor<T>['renderItem'];
  renderSkeleton: (cellWidth: number) => ReactNode;
  section: SurfaceLeaf;
  showHeaderCaret?: boolean;
  skeletonCount?: number;
  surfaceId: SurfaceId;
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
  renderItem,
  renderSkeleton,
  section,
  showHeaderCaret,
  skeletonCount = GRID_COLUMNS * 2,
  surfaceId,
  title,
}: MarketGridProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const cellWidth = (screenWidth - 2 * GRID_SPACING - (GRID_COLUMNS - 1) * GRID_SPACING) / GRID_COLUMNS;
  const showSkeletons = loading && data.length === 0;

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <SectionHeader count={headerCount} leadingAccessory={leadingAccessory} title={title} onPress={onPress} showCaret={showHeaderCaret} />

      <View style={styles.gridContainer}>
        {showSkeletons ? (
          <Grid columns={GRID_COLUMNS} spacing={GRID_SPACING}>
            {Array.from({ length: skeletonCount }, (_, index) => (
              <View key={index} style={{ height: itemHeight }}>
                {renderSkeleton(cellWidth)}
              </View>
            ))}
          </Grid>
        ) : (
          <Grid columns={GRID_COLUMNS} spacing={GRID_SPACING}>
            {data.map((item, index) => {
              const onCardPress: CardPressHandler = placement
                ? metadata => {
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
                      marketType: placement.type,
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
                      type: placement.type,
                      version: placement.version,
                    });
                  }
                : noopCardPress;
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
                : noopOrderPress;
              return (
                <View key={item.id} style={{ height: itemHeight }}>
                  {renderItem(item, cellWidth, onCardPress, onOrderPress)}
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
