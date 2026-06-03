import { MarketCarousel } from '@/features/discover/components/markets/layouts/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/markets/layouts/MarketGrid';
import { MarketList } from '@/features/discover/components/markets/layouts/MarketList';
import { type SectionDescriptor, type SectionLayoutProps } from '@/features/discover/types/sectionLayout';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type PlacementItem } from '@/features/placements/types';
import * as i18n from '@/languages';

/**
 * Resolves a section's display title: a localized `discover.sections.<id>` label
 * when one exists, otherwise the server-provided label, falling back to the raw id.
 */
export function resolveSectionTitle(surface: Pick<SurfaceLeaf, 'id' | 'label'>): string {
  return i18n.t(`discover.sections.${surface.id}`, { defaultValue: surface.label || surface.id });
}

/**
 * Header count that matches what the layout actually renders: list layouts show the full
 * (expandable) item count; carousel/grid cap at `limit` exactly as renderSectionLayout slices.
 * Returns undefined for an empty count so the header omits the badge.
 */
export function getRenderedHeaderCount<T extends PlacementItem>({
  descriptor,
  itemCount,
  limit,
}: {
  descriptor: SectionDescriptor<T>;
  itemCount: number;
  limit: number | undefined;
}): number | undefined {
  const count = descriptor.layout === 'list' ? itemCount : limit !== undefined ? Math.min(itemCount, limit) : itemCount;
  return count > 0 ? count : undefined;
}

export function renderSectionLayout<T extends PlacementItem>({
  data,
  descriptor,
  headerCaret,
  headerCount,
  leadingAccessory,
  loading,
  onPressSeeAll,
  surface,
}: SectionLayoutProps<T>) {
  const hasLimit = surface.limit !== undefined;
  const renderedData = hasLimit ? data.slice(0, surface.limit) : data;
  const skeletonCount = hasLimit ? surface.limit : undefined;
  const descriptorHeaderCaret = 'showHeaderCaret' in descriptor ? descriptor.showHeaderCaret?.(surface) : undefined;
  const showHeaderCaret = headerCaret ?? descriptorHeaderCaret;
  const title = resolveSectionTitle(surface);
  const sectionProps = {
    headerCount,
    leadingAccessory,
    loading,
    onPress: onPressSeeAll,
    title,
  };

  switch (descriptor.layout) {
    case 'carousel':
      return (
        <MarketCarousel
          {...sectionProps}
          data={renderedData}
          getItemWidth={descriptor.getItemWidth}
          itemHorizontalBleed={descriptor.itemHorizontalBleed}
          itemHeight={descriptor.itemHeight}
          itemVerticalBleed={descriptor.itemVerticalBleed}
          itemWidth={descriptor.itemWidth}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret}
          singleItemWidth={descriptor.singleItemWidth}
          skeletonCount={skeletonCount}
        />
      );
    case 'grid':
      return (
        <MarketGrid
          {...sectionProps}
          data={renderedData}
          itemHeight={descriptor.itemHeight}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret}
          skeletonCount={skeletonCount}
        />
      );
    case 'list':
      return (
        <MarketList
          {...sectionProps}
          data={data}
          initialVisibleItemCount={surface.limit}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret}
        />
      );
  }
}
