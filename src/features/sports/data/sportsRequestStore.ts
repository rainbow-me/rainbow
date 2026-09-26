import { createDerivedStore, type DerivedStore } from '@storesjs/stores';

import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { type SportsDestination, type SportsHost, type SportsWindow } from '@/features/sports/core/browse';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsWindowStore } from '@/features/sports/data/sportsWindowStore';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Types ========================================================== //

export type SportsPageRequest =
  | { type: 'live' }
  | { type: 'catalog' }
  | { type: 'scope'; scopeId: string; window: SportsWindow }
  | { type: 'search'; query: string; window: Pick<SportsWindow, 'from' | 'until'> };

export type SportsRequest = SportsPageRequest | { type: 'event'; eventId: string };

// ============ Page Requests ================================================== //

/**
 * The browse or Search request for Sports and Predictions, kept separately for each screen.
 */
export const sportsPageRequestStores = {
  main: createPageRequestStore('main'),
  predictions: createPageRequestStore('predictions'),
};

function createPageRequestStore(host: SportsHost): DerivedStore<SportsPageRequest | null> {
  return createDerivedStore($ => {
    const query = $(sportsNavigationStores[host], state => state.query);
    if (query === '') return null;
    if (query !== null) return { type: 'search', query, window: $(sportsWindowStore, window => window) };

    const destination = $(sportsNavigationStores[host], state => state.destination);
    if (destination === 'live') return { type: 'live' };
    if (destination === 'all') return { type: 'catalog' };
    return { type: 'scope', scopeId: destination, window: $(sportsWindowStore, window => window) };
  });
}

/**
 * The destination whose games a Live or scope request shows.
 */
export function getRequestDestination(request: { type: 'live' } | { type: 'scope'; scopeId: string }): SportsDestination {
  return request.type === 'live' ? 'live' : request.scopeId;
}

// ============ Active Request ================================================= //

/**
 * The Sports page or selected event for the active screen.
 */
export const sportsRequestStore = createDerivedStore<SportsRequest | null>($ => {
  const route = $(useNavigationStore, state => state.activeRoute);

  switch (route) {
    case Routes.SPORTS_SCREEN:
      return $(sportsPageRequestStores.main, request => request);

    case Routes.POLYMARKET_BROWSE_EVENTS_SCREEN: {
      const showsSports = $(usePolymarketCategoryStore, state => state.tagId === 'sports');
      return showsSports ? $(sportsPageRequestStores.predictions, request => request) : null;
    }

    case Routes.POLYMARKET_EVENT_SCREEN: {
      const eventId = $(polymarketEventIdStore, state => state.eventId);
      return eventId ? { type: 'event', eventId } : null;
    }

    default:
      return null;
  }
});
