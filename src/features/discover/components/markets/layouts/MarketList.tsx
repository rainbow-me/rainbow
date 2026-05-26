import { Fragment, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Box } from '@/design-system';
import { CarouselHeader } from '@/features/discover/components/markets/layouts/CarouselHeader';
import { type DiscoverCardAnalyticsContext } from '@/features/discover/components/surfaceSectionTypes';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';

import { ShowMoreButton } from './ShowMoreButton';
import { ShowMoreCellEnterAnimation } from './ShowMoreCellEnterAnimation';

const DEFAULT_SKELETON_ITEM_COUNT = 5;
const HORIZONTAL_PADDING = 12;

type MarketListProps<T extends PlacementItem> = {
  data: T[];
  headerCount?: number;
  initialVisibleItemCount?: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  placement: Placement | undefined;
  placementId: PlacementId | undefined;
  renderItem: (item: T, analyticsContext: DiscoverCardAnalyticsContext) => ReactNode;
  renderSkeleton: () => ReactNode;
  showHeaderCaret?: boolean;
  surfaceId: string;
  title: string;
};

export function MarketList<T extends PlacementItem>({
  data,
  headerCount,
  initialVisibleItemCount,
  leadingAccessory,
  loading,
  onPress,
  placement,
  placementId,
  renderItem,
  renderSkeleton,
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

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <CarouselHeader count={headerCount} leadingAccessory={leadingAccessory} title={title} onPress={onPress} showCaret={showHeaderCaret} />
      <Box gap={8} paddingHorizontal={{ custom: HORIZONTAL_PADDING }}>
        {showSkeletons
          ? Array.from({ length: skeletonItemCount }).map((_, index) => <Fragment key={index}>{renderSkeleton()}</Fragment>)
          : visibleItems.map((item, index) => {
              const analyticsContext = getAnalyticsContext({ item, itemIndex: index, placement, placementId, surfaceId, title });
              const listItem = <View>{renderItem(item, analyticsContext)}</View>;

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
