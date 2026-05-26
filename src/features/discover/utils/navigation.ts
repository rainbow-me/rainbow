import { navigateToPerps, navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { type Destination } from '@/features/placements/surfaces/types';
import { DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import {
  navigateToPolymarket,
  navigateToPolymarketCategory,
  navigateToPolymarketSportsLeague,
} from '@/features/polymarket/utils/navigateToPolymarket';

export function navigateDiscoverDestination(destination: Destination): void {
  if (!destination) return;

  const [root, ...segments] = destination;

  switch (root) {
    case 'predictions': {
      const [category, league] = segments;
      if (category === 'sports') navigateToPolymarketSportsLeague(league ?? DEFAULT_SPORTS_LEAGUE_KEY);
      else if (category) navigateToPolymarketCategory(category);
      else navigateToPolymarket();
      return;
    }
    case 'perps':
      if (segments.length) navigateToPerpsSearch();
      else navigateToPerps();
      return;
    case 'tokens':
      return;
  }
}
