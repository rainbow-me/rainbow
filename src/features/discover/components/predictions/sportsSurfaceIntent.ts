import { type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { getLeagueId, isLeagueId, type LeagueId } from '@/features/polymarket/leagues';
import {
  getSportsEventScheduleBucket,
  isLiveSportsEvent,
  type SportsEventScheduleBucket,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

export type SportsSurfaceIntent = { status: 'live' } | { timeBucket: Extract<SportsEventScheduleBucket, 'today'> } | { leagueId: LeagueId };

export function getSportsSurfaceIntent(surface: SurfaceLeaf): SportsSurfaceIntent | null {
  if (!isSportsEventCardDisplay(surface.display)) return null;

  const sportsFilters = surface.filters?.sports;
  if (!sportsFilters) return null;

  const status = getStringFilterValue(sportsFilters.status);
  if (status === 'live') return { status };

  const timeBucket = getStringFilterValue(sportsFilters.timeBucket);
  if (timeBucket === 'today') return { timeBucket };

  const leagueId = getStringFilterValue(sportsFilters.leagueId);
  if (leagueId && isLeagueId(leagueId)) return { leagueId };

  return null;
}

export function selectSportsEventsForIntent(events: PolymarketEvent[], intent: SportsSurfaceIntent): PolymarketEvent[] {
  if ('status' in intent) return events.filter(isLiveSportsEvent);
  if ('timeBucket' in intent) return events.filter(event => getSportsEventScheduleBucket(event) === intent.timeBucket);
  return events.filter(event => getLeagueId(event.slug) === intent.leagueId);
}

function getStringFilterValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
}

function isSportsEventCardDisplay(display: SurfaceLeaf['display']): boolean {
  return display === 'prediction_event_card.carousel' || display === 'prediction_event_card.list';
}
