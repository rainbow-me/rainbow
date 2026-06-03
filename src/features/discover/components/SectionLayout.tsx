import { StyleSheet } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { MarketCarousel } from '@/features/discover/components/markets/layouts/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/markets/layouts/MarketGrid';
import { MarketList } from '@/features/discover/components/markets/layouts/MarketList';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { getSportsSurfaceIntent } from '@/features/discover/utils/sportsSurfaceIntent';
import { isEventCardDisplay } from '@/features/placements/surfaces/constants';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type PlacementItem } from '@/features/placements/types';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { LiveSectionIndicator } from '@/features/polymarket/components/LiveSectionIndicator';
import * as i18n from '@/languages';

import { type SectionLayoutProps } from './surfaceSectionTypes';

const LIVE_INDICATOR_HEADER_GAP = 10;
const HEADER_ACCESSORY_GAP = 4;

const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;

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
  placement,
  surface,
  surfaceId,
}: SectionLayoutProps<T>) {
  const leadingAccessory = renderSurfaceHeaderLeadingAccessory(surface);
  const hasLimit = surface.limit !== undefined;
  const renderedData = hasLimit ? data.slice(0, surface.limit) : data;
  const skeletonCount = hasLimit ? surface.limit : undefined;
  const sportsHeaderCaret = getSportsSurfaceHeaderCaret(surface);
  const descriptorHeaderCaret = 'showHeaderCaret' in descriptor ? descriptor.showHeaderCaret?.(surface) : undefined;
  const showHeaderCaret = sportsHeaderCaret ?? descriptorHeaderCaret;
  const title = resolveSectionTitle(surface);
  const onPress = onPressSeeAll
    ? () => {
        analytics.track(event.discoverSectionPressed, {
          destination: surface.destination,
          display: surface.display,
          placementId: surface.placement ?? undefined,
          placementSource: placement?.source,
          placementType: placement?.type,
          placementVersion: placement?.version,
          sectionId: surface.id,
          sectionTitle: title,
          surfaceId,
        });
        onPressSeeAll();
      }
    : undefined;
  const sectionProps = {
    headerCount,
    leadingAccessory,
    loading,
    onPress,
    placement,
    placementId: surface.placement ?? undefined,
    sectionId: surface.id,
    surfaceId,
    title,
  };

  switch (descriptor.layout) {
    case 'carousel':
      return (
        <MarketCarousel
          {...sectionProps}
          data={renderedData}
          display={surface.display}
          getItemWidth={descriptor.getItemWidth}
          itemHeight={descriptor.itemHeight}
          itemVerticalBleed={descriptor.itemVerticalBleed}
          itemWidth={descriptor.itemWidth}
          renderItem={descriptor.renderItem}
          renderSkeleton={descriptor.renderSkeleton}
          showHeaderCaret={showHeaderCaret ?? descriptor.showHeaderCaret?.(surface)}
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
          showHeaderCaret={showHeaderCaret ?? descriptor.showHeaderCaret?.(surface)}
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

export function getHeaderPress(destination: SurfaceLeaf['destination']): (() => void) | undefined {
  if (!destination) return undefined;
  return () => navigateDiscoverDestination(destination);
}

export function getInitialRenderedItemCount<T>(items: T[], limit: number | undefined): number {
  return limit === undefined ? items.length : Math.min(items.length, limit);
}

export function isLiveSportsSurface(surface: SurfaceLeaf): boolean {
  const intent = getSportsSurfaceIntent(surface);
  return intent !== null && 'status' in intent && intent.status === 'live';
}

export function isEventCardSurface(surface: SurfaceLeaf): boolean {
  return isEventCardDisplay(surface.display);
}

function getSportsSurfaceHeaderCaret(surface: SurfaceLeaf): boolean | undefined {
  if (isLiveSportsSurface(surface)) return false;
  if (isEventCardSurface(surface)) return hasDestination(surface);
  return undefined;
}

function renderSurfaceHeaderLeadingAccessory(surface: SurfaceLeaf) {
  if (isLiveSportsSurface(surface)) return <LiveSectionIndicator style={styles.liveHeaderIndicator} />;

  const intent = getSportsSurfaceIntent(surface);
  return intent && 'leagueId' in intent ? <LeagueIcon leagueId={intent.leagueId} size={28} /> : null;
}

const styles = StyleSheet.create({
  liveHeaderIndicator: {
    marginRight: LIVE_INDICATOR_HEADER_GAP - HEADER_ACCESSORY_GAP,
  },
});
