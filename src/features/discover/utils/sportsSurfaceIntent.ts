import { type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { isEventCardDisplay } from '@/features/placements/surfaces/utils/surfaceDisplay';
import { getLeagueId, type LeagueId } from '@/features/polymarket/leagues';
import {
  getSportsEventScheduleBucket,
  isLiveSportsEvent,
  type SportsEventScheduleBucket,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

export type SportsSurfaceIntent = { status: 'live' } | { timeBucket: Extract<SportsEventScheduleBucket, 'today'> } | { leagueId: LeagueId };

export function getSportsSurfaceIntent(surface: SurfaceLeafNode): SportsSurfaceIntent | null {
  if (!isEventCardDisplay(surface.display)) return null;

  if (surface.id === 'live') return { status: 'live' };
  if (surface.id === 'today') return { timeBucket: 'today' };

  const leagueId = getLeagueId(surface.id);
  return leagueId ? { leagueId } : null;
}

export function selectSportsEventsForIntent(events: PolymarketEvent[], intent: SportsSurfaceIntent): PolymarketEvent[] {
  if ('status' in intent) return events.filter(isLiveSportsEvent);
  if ('timeBucket' in intent) return events.filter(event => getSportsEventScheduleBucket(event) === intent.timeBucket);
  return events.filter(event => getLeagueId(event.slug) === intent.leagueId);
}
