import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { ShowMoreCellEnterAnimation } from '@/components/animations/ShowMoreCellEnterAnimation';
import { ShowMoreButton } from '@/components/buttons/ShowMoreButton';
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

const DEFAULT_VISIBLE_ITEM_COUNT = 5;

type MarketListProps<T extends PlacementItem> = {
  data: T[];
  destination: Destination;
  initialVisibleItemCount?: number;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  surfaceId: string;
  title: string;
};

export function MarketList<T extends PlacementItem>({
  data,
  destination,
  initialVisibleItemCount = DEFAULT_VISIBLE_ITEM_COUNT,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  surfaceId,
  title,
}: MarketListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showSkeletons = loading && data.length === 0;
  const visibleItems = isExpanded ? data : data.slice(0, initialVisibleItemCount);
  const remainingItemCount = data.length - visibleItems.length;

  const handleSeeAllPress = useCallback(() => {
    trackPlacementSeeAllPress({ destination, placementId, surfaceId, title });
    onPressSeeAll?.();
  }, [destination, onPressSeeAll, placementId, surfaceId, title]);

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader title={title} onPress={onPressSeeAll ? handleSeeAllPress : undefined} />
      <Box gap={8} paddingHorizontal={{ custom: SCREEN_HORIZONTAL_PADDING }}>
        {showSkeletons
          ? Array.from({ length: initialVisibleItemCount }).map((_, index) => <Fragment key={index}>{renderSkeleton()}</Fragment>)
          : visibleItems.map((item, index) => {
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
              const listItem = (
                <PlacementCardProvider value={trackPress}>
                  <PlacementPredictionOutcomeProvider value={trackOutcomePress}>
                    <View>{renderItem(item)}</View>
                  </PlacementPredictionOutcomeProvider>
                </PlacementCardProvider>
              );

              if (!isExpanded || index < initialVisibleItemCount) return <Fragment key={item.id}>{listItem}</Fragment>;

              return (
                <ShowMoreCellEnterAnimation key={item.id} index={index - initialVisibleItemCount}>
                  {listItem}
                </ShowMoreCellEnterAnimation>
              );
            })}
        {!showSkeletons && remainingItemCount > 0 && <ShowMoreButton count={remainingItemCount} onPress={() => setIsExpanded(true)} />}
      </Box>
    </Box>
  );
}
