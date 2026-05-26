import { navigateToPerpsDestination } from '@/features/perps/utils/navigateToPerps';
import { type Destination } from '@/features/placements/surfaces/types';
import { navigateToPolymarketDestination } from '@/features/polymarket/utils/navigateToPolymarket';

export function navigateDiscoverDestination(destination: Destination): void {
  if (!destination) return;

  const [root, ...segments] = destination;

  switch (root) {
    case 'predictions':
      navigateToPolymarketDestination(segments);
      return;
    case 'perps':
      navigateToPerpsDestination(segments);
      return;
    case 'tokens':
      return;
  }
}
