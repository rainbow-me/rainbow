import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { trackSurfaceSectionDrilldownPress } from '@/features/discover/components/marketPress/marketPressContext';
import { PlacementTrackedItem } from '@/features/discover/components/PlacementTrackedItem';
import { type Destination, type Display } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';

import { ShowMoreButton } from './ShowMoreButton';
import { ShowMoreCellEnterAnimation } from './ShowMoreCellEnterAnimation';

const DEFAULT_SKELETON_ITEM_COUNT = 5;
const HORIZONTAL_PADDING = 12;

type MarketListProps<T extends PlacementItem> = {
  data: T[];
  destination: Destination;
  display: Display;
  headerCount?: number;
  initialVisibleItemCount?: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPressSeeAll?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  sectionId: string;
  showHeaderCaret?: boolean;
  surfaceId: string;
  title: string;
};

export function MarketList<T extends PlacementItem>({
  data,
  destination,
  display,
  headerCount,
  initialVisibleItemCount,
  leadingAccessory,
  loading,
  onPressSeeAll,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
  sectionId,
  showHeaderCaret,
  surfaceId,
  title,
}: MarketListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showSkeletons = loading && data.length === 0;
  const hasInitialLimit = initialVisibleItemCount !== undefined;
  const visibleItems = !hasInitialLimit || isExpanded ? data : data.slice(0, initialVisibleItemCount);
  const remainingItemCount = hasInitialLimit ? data.length - visibleItems.length : 0;
  const skeletonItemCount = initialVisibleItemCount ?? DEFAULT_SKELETON_ITEM_COUNT;

  const handleSeeAllPress = useCallback(() => {
    trackSurfaceSectionDrilldownPress({ destination, display, placement, placementId, sectionId, surfaceId, title });
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
      <Box gap={8} paddingHorizontal={{ custom: HORIZONTAL_PADDING }}>
        {showSkeletons
          ? Array.from({ length: skeletonItemCount }).map((_, index) => <Fragment key={index}>{renderSkeleton()}</Fragment>)
          : visibleItems.map((item, index) => {
              const listItem = (
                <PlacementTrackedItem
                  item={item}
                  itemIndex={index}
                  placement={placement}
                  placementId={placementId}
                  surfaceId={surfaceId}
                  title={title}
                >
                  <View>{renderItem(item)}</View>
                </PlacementTrackedItem>
              );

              if (!hasInitialLimit || !isExpanded || index < (initialVisibleItemCount ?? 0)) {
                return <Fragment key={item.id}>{listItem}</Fragment>;
              }

              return (
                <ShowMoreCellEnterAnimation key={item.id} index={index - (initialVisibleItemCount ?? 0)}>
                  {listItem}
                </ShowMoreCellEnterAnimation>
              );
            })}
        {!showSkeletons && remainingItemCount > 0 && <ShowMoreButton onPress={() => setIsExpanded(true)} />}
      </Box>
    </Box>
  );
}
