import { Fragment, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { Box } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { type CardPressHandler, type ListSectionDescriptor, type OrderPressHandler } from '@/features/discover/types/sectionLayout';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { placementType } from '@/features/placements/utils/placementType';

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
  section: SurfaceLeafNode;
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
                    const derivedPlacementType = placementType(placement.source);

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
                      marketType: derivedPlacementType,
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
                      type: derivedPlacementType,
                      version: placement.version,
                    });
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
