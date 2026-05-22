import { navigateToPerpsDestination } from '@/features/perps/utils/navigateToPerps';
import { type Destination } from '@/features/placements/surfaces/types';
import { navigateToPolymarketDestination } from '@/features/polymarket/utils/navigateToPolymarket';
import { logger } from '@/logger';

let didWarnUnsupportedDappsDestination = false;

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
