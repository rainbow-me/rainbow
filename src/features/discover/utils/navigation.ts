import { navigateToPerps, navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { type Destination } from '@/features/placements/surfaces/types';
import { CATEGORIES, DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { logger } from '@/logger';

let didWarnUnsupportedDappsDestination = false;

export function navigateDiscoverDestination(destination: Destination): void {
  if (!destination) return;

  const [root, ...segments] = destination;

  switch (root) {
    case 'predictions':
      navigatePolymarketSegments(segments);
      return;
    case 'perps':
      navigatePerpsSegments(segments);
      return;
    case 'tokens':
      return;
    case 'dapps':
      warnUnsupportedDappsDestination(destination);
      return;
  }
}

function warnUnsupportedDappsDestination(destination: Destination): void {
  if (didWarnUnsupportedDappsDestination) return;
  didWarnUnsupportedDappsDestination = true;
  logger.warn('[discover]: dapps surface destinations are not supported yet', { destination });
}

function navigatePolymarketSegments(segments: string[]): void {
  const [category, league] = segments;

  if (category === 'sports') {
    navigateToPolymarketSportsLeague(league ?? DEFAULT_SPORTS_LEAGUE_KEY);
    return;
  }

  if (category) {
    navigateToPolymarketCategory(category);
    return;
  }

  navigateToPolymarket();
}

function navigatePerpsSegments(segments: string[]): void {
  if (segments.length) {
    navigateToPerpsSearch();
    return;
  }

  navigateToPerps();
}

export function navigateToPolymarketCategory(tagId: string): void {
  usePolymarketCategoryStore.getState().setTagId(tagId);
  usePolymarketSportsEventsStore.getState().setSelectedLeagueId(DEFAULT_SPORTS_LEAGUE_KEY);

  navigateToPolymarket();
}

export function navigateToPolymarketSportsLeague(leagueId: string): void {
  const sportsTagId = CATEGORIES.sports.tagId;
  if (!sportsTagId) return;

  usePolymarketCategoryStore.getState().setTagId(sportsTagId);
  usePolymarketSportsEventsStore.getState().setSelectedLeagueId(leagueId);
  navigateToPolymarket();
}
