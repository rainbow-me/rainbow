import { navigateToPerps, navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { type Destination, type DestinationRoot } from '@/features/placements/surfaces/types';
import { DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import {
  navigateToPolymarket,
  navigateToPolymarketCategory,
  navigateToPolymarketSportsLeague,
} from '@/features/polymarket/utils/navigateToPolymarket';

export type DestinationForRoot<Root extends DestinationRoot> = [Root, ...string[]];

export type NavigableDiscoverDestination = DestinationForRoot<'perps'> | DestinationForRoot<'predictions'>;

export function navigateDiscoverDestination(destination: NavigableDiscoverDestination): void {
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
  }
}

export function hasDestinationRoot<Root extends DestinationRoot>(
  destination: Destination,
  root: Root
): destination is DestinationForRoot<Root> {
  return destination?.[0] === root;
}
