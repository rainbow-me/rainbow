import { Fragment, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type DiscoverCardAnalyticsContext } from '@/features/discover/components/surfaceSectionTypes';
import {
  type PlacementV2 as Placement,
  type PlacementIdV2 as PlacementId,
  type PlacementItemV2 as PlacementItem,
} from '@/features/placements/types';

import { ShowMoreButton, ShowMoreCellEnterAnimation } from './ShowMoreButton';

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

/**
 * Renders a skeleton via its own component fiber so any hooks the skeleton uses stay
 * isolated from MarketList's render, keeping MarketList's hook count stable across the
 * loading→loaded transition.
 */
function SkeletonSlot({ render }: { render: () => ReactNode }) {
  return <>{render()}</>;
}

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
      <SectionHeader count={headerCount} leadingAccessory={leadingAccessory} title={title} onPress={onPress} showCaret={showHeaderCaret} />
      <Box gap={8} paddingHorizontal={{ custom: HORIZONTAL_PADDING }}>
        {showSkeletons
          ? Array.from({ length: skeletonItemCount }).map((_, index) => <SkeletonSlot key={index} render={renderSkeleton} />)
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
    placementType: placement?.type,
    surfaceId,
  };
}
