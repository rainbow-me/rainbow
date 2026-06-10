import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { MarketCarousel } from '@/features/discover/components/markets/layouts/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/markets/layouts/MarketGrid';
import { MarketList } from '@/features/discover/components/markets/layouts/MarketList';
import { type SectionDescriptor, type SectionLayoutProps } from '@/features/discover/types/sectionLayout';
import { type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { type PlacementItem } from '@/features/placements/types';
import * as i18n from '@/languages';

/**
 * Resolves a section's display title: a localized `discover.sections.<id>` label
 * when one exists, otherwise the server-provided label.
 */
export function resolveSectionTitle(section: Pick<SurfaceLeafNode, 'id' | 'label'>): string {
  return i18n.t(`discover.sections.${section.id}`, { defaultValue: section.label });
}

/**
 * Header count that matches what the layout actually renders: list layouts show the full
 * expandable count, while carousel/grid cap at the surface limit.
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
  onPress,
  placement,
  section,
  surfaceId,
}: SectionLayoutProps<T>) {
  const hasLimit = section.limit !== undefined;
  const renderedData = hasLimit && descriptor.layout !== 'list' ? data.slice(0, section.limit) : data;
  const skeletonCount = hasLimit ? section.limit : undefined;
  const descriptorHeaderCaret = 'showHeaderCaret' in descriptor ? descriptor.showHeaderCaret?.(section) : undefined;
  const showHeaderCaret = headerCaret ?? descriptorHeaderCaret;
  const title = resolveSectionTitle(section);
  const headerPress = onPress
    ? () => {
        analytics.track(event.discoverSectionPressed, {
          destination: section.destination,
          display: section.display,
          sectionId: section.id,
          sectionTitle: title,
        });
        onPress();
      }
    : undefined;

  switch (descriptor.layout) {
    case 'carousel':
      return (
        <MarketCarousel
          data={renderedData}
          getItemWidth={descriptor.getItemWidth}
          headerCount={headerCount}
          itemHorizontalBleed={descriptor.itemHorizontalBleed}
          itemHeight={descriptor.itemHeight}
          itemVerticalBleed={descriptor.itemVerticalBleed}
          itemWidth={descriptor.itemWidth}
          leadingAccessory={leadingAccessory}
          loading={loading}
          onPress={headerPress}
          placement={placement}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret}
          singleItemWidth={descriptor.singleItemWidth}
          skeletonCount={skeletonCount}
          section={section}
          surfaceId={surfaceId}
          title={title}
        />
      );
    case 'grid':
      return (
        <MarketGrid
          data={renderedData}
          headerCount={headerCount}
          itemHeight={descriptor.itemHeight}
          leadingAccessory={leadingAccessory}
          loading={loading}
          onPress={headerPress}
          placement={placement}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret}
          skeletonCount={skeletonCount}
          section={section}
          surfaceId={surfaceId}
          title={title}
        />
      );
    case 'list':
      return (
        <MarketList
          data={renderedData}
          headerCount={headerCount}
          initialVisibleItemCount={section.limit}
          leadingAccessory={leadingAccessory}
          loading={loading}
          onPress={headerPress}
          placement={placement}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          section={section}
          showHeaderCaret={showHeaderCaret}
          surfaceId={surfaceId}
          title={title}
        />
      );
  }
}
