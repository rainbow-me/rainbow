import { createDerivedStore, type DerivedStore } from '@storesjs/stores';

import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { type SportsDestination, type SportsHost, type SportsWindow } from '@/features/sports/core/browse';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsWindowStore } from '@/features/sports/data/sportsWindowStore';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Types ========================================================== //

/**
 * A request for a Sports browse or Search page.
 */
export type SportsPageRequest =
  | { type: 'live' }
  | { type: 'catalog' }
  | { type: 'scope'; scopeId: string; window: SportsWindow }
  | { type: 'search'; query: string; window: Pick<SportsWindow, 'from' | 'until'> };

/**
 * A request for a Sports page or the selected event's game.
 */
export type SportsRequest = SportsPageRequest | { type: 'event'; eventId: string };

// ============ Page Requests ================================================== //

/**
 * Each screen's Sports page request, or `null` when Search is open and empty.
 */
export const sportsPageRequestStores = {
  main: createPageRequestStore('main'),
  predictions: createPageRequestStore('predictions'),
};

function createPageRequestStore(host: SportsHost): DerivedStore<SportsPageRequest | null> {
  return createDerivedStore($ => {
    const query = $(sportsNavigationStores[host], s => s.query);
    if (query === '') return null;

    if (query) {
      const window = $(sportsWindowStore, s => s);
      return { type: 'search', query, window: { from: window.from, until: window.until } };
    }

    const destination = $(sportsNavigationStores[host], s => s.destination);
    if (destination === 'live') return { type: 'live' };
    if (destination === 'all') return { type: 'catalog' };

    return { type: 'scope', scopeId: destination, window: $(sportsWindowStore, window => window) };
  });
}

/**
 * Returns the browse destination for a Live or scope request.
 */
export function getRequestDestination(request: { type: 'live' } | { type: 'scope'; scopeId: string }): SportsDestination {
  return request.type === 'live' ? 'live' : request.scopeId;
}

// ============ Active Request ================================================= //

/**
 * The Sports request for the active screen, or `null` when none is needed.
 */
export const sportsRequestStore = createDerivedStore<SportsRequest | null>($ => {
  const route = $(useNavigationStore, s => s.activeRoute);

  switch (route) {
    case Routes.SPORTS_SCREEN:
      return $(sportsPageRequestStores.main, s => s);

    case Routes.POLYMARKET_BROWSE_EVENTS_SCREEN: {
      const showsSports = $(usePolymarketCategoryStore, s => s.tagId === 'sports');
      return showsSports ? $(sportsPageRequestStores.predictions, s => s) : null;
    }

    case Routes.POLYMARKET_EVENT_SCREEN: {
      const eventId = $(polymarketEventIdStore, s => s.eventId);
      return eventId ? { type: 'event', eventId } : null;
    }

    default:
      return null;
  }
});
