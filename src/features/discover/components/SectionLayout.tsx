import { StyleSheet } from 'react-native';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { MarketCarousel } from '@/features/discover/components/markets/layouts/MarketCarousel';
import { MarketGrid } from '@/features/discover/components/markets/layouts/MarketGrid';
import { MarketList } from '@/features/discover/components/markets/layouts/MarketList';
import { navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type PlacementItem } from '@/features/placements/types';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { LiveSectionIndicator } from '@/features/polymarket/components/LiveSectionIndicator';
import { getLeagueId, isLeagueId, SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import {
  getSportsEventScheduleBucket,
  type SportsEventScheduleBucket,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

import { type SectionLayoutProps } from './surfaceSectionTypes';

const LIVE_INDICATOR_HEADER_GAP = 10;
const HEADER_ACCESSORY_GAP = 4;

const hasDestination = (surface: SurfaceLeaf) => surface.destination !== null;

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
  const showHeaderCaret = getSurfaceHeaderCaret(surface);
  const title = surface.label || surface.id;
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

export function getSportsEventHeaderCount({
  displayedItemCount,
  events,
  surface,
}: {
  displayedItemCount: number;
  events: PolymarketEvent[] | null | undefined;
  surface: SurfaceLeaf;
}): number | undefined {
  if (!isSportsEventCardSurface(surface) || !events) return undefined;

  const count = getSportsEventCountForSurface(surface, events);
  if (count === undefined || count === 0 || count === displayedItemCount) return undefined;
  return count;
}

export function getInitialRenderedItemCount<T>(items: T[], limit: number | undefined): number {
  return limit === undefined ? items.length : Math.min(items.length, limit);
}

export function isLiveSportsSurface(surface: SurfaceLeaf): boolean {
  if (!isSportsEventCardSurface(surface)) return false;

  const surfaceKeys = [getSurfaceValueKey(surface.id), getSurfaceValueKey(surface.label)];
  if (surfaceKeys.some(key => key.split('_').includes('live'))) return true;

  return (
    surface.placement == null &&
    surface.destination?.[0] === 'predictions' &&
    surface.destination?.[1] === 'sports' &&
    getSurfaceTimeBucket(surface) === undefined &&
    getSurfaceLeagueId(surface) === undefined
  );
}

export function isSportsEventCardSurface(surface: SurfaceLeaf): boolean {
  return surface.display === 'prediction_event_card.carousel' || surface.display === 'prediction_event_card.list';
}

export function getSurfaceLeagueId(surface: SurfaceLeaf): LeagueId | undefined {
  return getLeagueIdBySurfaceValue(surface.label) ?? getLeagueIdBySurfaceValue(surface.id);
}

export function getSurfaceTimeBucket(surface: SurfaceLeaf): SportsEventScheduleBucket | undefined {
  const values = [getSurfaceValueKey(surface.id), getSurfaceValueKey(surface.label)];
  if (values.includes('today')) return 'today';
  if (values.includes('this_week')) return 'this-week';
  return undefined;
}

function getSurfaceHeaderCaret(surface: SurfaceLeaf): boolean | undefined {
  if (isLiveSportsSurface(surface)) return false;
  if (isSportsEventCardSurface(surface)) return hasDestination(surface);
  return undefined;
}

function getSportsEventCountForSurface(surface: SurfaceLeaf, events: PolymarketEvent[]): number | undefined {
  if (isLiveSportsSurface(surface)) return countSportsEventsForTimeBucket(events, 'live');

  const timeBucket = getSurfaceTimeBucket(surface);
  if (timeBucket) return countSportsEventsForTimeBucket(events, timeBucket);

  const leagueId = getSurfaceLeagueId(surface);
  if (leagueId) return events.filter(event => getLeagueId(event.slug) === leagueId).length;
  return undefined;
}

function countSportsEventsForTimeBucket(events: PolymarketEvent[], timeBucket: SportsEventScheduleBucket): number {
  return events.filter(event => {
    return getSportsEventScheduleBucket(event) === timeBucket;
  }).length;
}

function renderSurfaceHeaderLeadingAccessory(surface: SurfaceLeaf) {
  if (isLiveSportsSurface(surface)) return <LiveSectionIndicator style={styles.liveHeaderIndicator} />;

  const leagueId = getSurfaceLeagueId(surface);
  return leagueId ? <LeagueIcon leagueId={leagueId} size={28} /> : null;
}

function getLeagueIdBySurfaceValue(value: string | undefined): LeagueId | undefined {
  const normalizedValue = getNormalizedSurfaceValue(value);
  if (!normalizedValue) return undefined;
  const leagueId = getLeagueId(normalizedValue);
  if (leagueId) return leagueId;

  const entry = Object.entries(SPORT_LEAGUES).find(
    ([leagueId, league]) => leagueId === normalizedValue || league.name.toLowerCase() === normalizedValue
  );
  if (entry && isLeagueId(entry[0])) return entry[0];

  return normalizedValue.split(/[^a-z0-9]+/).find(isLeagueId);
}

function getSurfaceValueKey(value: string | undefined): string {
  return getNormalizedSurfaceValue(value).replace(/[\s-]+/g, '_');
}

function getNormalizedSurfaceValue(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

const styles = StyleSheet.create({
  liveHeaderIndicator: {
    marginRight: LIVE_INDICATOR_HEADER_GAP - HEADER_ACCESSORY_GAP,
  },
});
