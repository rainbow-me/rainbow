import { Fragment, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type CardPressHandler, type ListSectionDescriptor, type OrderPressHandler } from '@/features/discover/types/sectionLayout';
import { trackDiscoverCardPress } from '@/features/discover/utils/trackDiscoverCardPress';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementItem } from '@/features/placements/types';

import { ShowMoreButton, ShowMoreCellEnterAnimation } from './ShowMoreButton';

function noopPress(): undefined {
  return undefined;
}

type MarketListProps<T extends PlacementItem> = {
  data: T[];
  headerCount?: number;
  initialVisibleItemCount?: number;
  leadingAccessory?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  placement?: Placement;
  renderItem: ListSectionDescriptor<T>['renderItem'];
  renderSkeleton: () => ReactNode;
  section: SurfaceLeaf;
  showHeaderCaret?: boolean;
  surfaceId: SurfaceId;
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
  renderItem,
  renderSkeleton,
  section,
  showHeaderCaret,
  surfaceId,
  title,
}: MarketListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showSkeletons = loading && data.length === 0;
  const hasInitialLimit = initialVisibleItemCount !== undefined;
  const visibleItems = !hasInitialLimit || isExpanded ? data : data.slice(0, initialVisibleItemCount);
  const remainingItemCount = hasInitialLimit ? data.length - visibleItems.length : 0;
  const skeletonItemCount = initialVisibleItemCount ?? 5;

  if (!showSkeletons && data.length === 0) return null;

  return (
    <Box gap={20}>
      <SectionHeader count={headerCount} leadingAccessory={leadingAccessory} title={title} onPress={onPress} showCaret={showHeaderCaret} />
      <Box gap={8} paddingHorizontal={{ custom: 12 }}>
        {showSkeletons
          ? Array.from({ length: skeletonItemCount }).map((_, index) => <SkeletonSlot key={index} render={renderSkeleton} />)
          : visibleItems.map((item, index) => {
              const onCardPress: CardPressHandler = placement
                ? metadata => {
                    trackDiscoverCardPress({ placement, section, surfaceId, title, itemId: item.id, itemOrder: index, metadata });
                  }
                : noopPress;
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
                : noopPress;
              const listItem = <View>{renderItem(item, onCardPress, onOrderPress)}</View>;

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
