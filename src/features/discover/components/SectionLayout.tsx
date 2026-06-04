import { MarketCarousel } from '@/features/discover/components/markets/layouts/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/markets/layouts/MarketGrid';
import { MarketList } from '@/features/discover/components/markets/layouts/MarketList';
import { type SectionLayoutProps } from '@/features/discover/types/sectionLayout';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type PlacementItemV2 as PlacementItem } from '@/features/placements/types';
import * as i18n from '@/languages';

/**
 * Resolves a section's display title: a localized `discover.sections.<id>` label
 * when one exists, otherwise the server-provided label, falling back to the raw id.
 */
export function resolveSectionTitle(surface: Pick<SurfaceLeaf, 'id' | 'label'>): string {
  return i18n.t(`discover.sections.${surface.id}`, { defaultValue: surface.label || surface.id });
}

export function renderSectionLayout<T extends PlacementItem>({
  data,
  descriptor,
  headerCount,
  loading,
  onPressSeeAll,
  surface,
}: SectionLayoutProps<T>) {
  const hasLimit = surface.limit !== undefined;
  const renderedData = hasLimit ? data.slice(0, surface.limit) : data;
  const skeletonCount = hasLimit ? surface.limit : undefined;
  const showHeaderCaret = 'showHeaderCaret' in descriptor ? descriptor.showHeaderCaret?.(surface) : undefined;
  const title = resolveSectionTitle(surface);

  const sectionProps = {
    headerCount,
    leadingAccessory: undefined,
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
