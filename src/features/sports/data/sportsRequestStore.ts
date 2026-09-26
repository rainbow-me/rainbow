import { createDerivedStore, type DerivedStore } from '@storesjs/stores';

import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { type SportsDestination, type SportsHost, type SportsWindow } from '@/features/sports/core/browse';
import { type SportsGamesScope } from '@/features/sports/core/sections';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsWindowStore } from '@/features/sports/data/sportsWindowStore';
import Routes, { type Route } from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Types ========================================================== //

/** Every sport's live games. It carries no week, so midnight does not request it again. */
export type LiveRequest = { type: 'live' };

/** The sports directory, which shows only the catalog. */
export type CatalogRequest = { type: 'catalog' };

/**
 * A scope's games in the week its page shows, so a new day requests it again. A sport browsed by competition shows
 * its live games instead.
 */
export type ScopeRequest = SportsGamesScope & { type: 'scope' };

/** A Search query over the week its page shows, so a new day starts it over. */
export type SearchRequest = { type: 'search'; query: string; window: Pick<SportsWindow, 'from' | 'until'> };

/** An event lookup for a route. The cache key uses the route; each event's last update determines whether it needs fetching. */
export type EventsRequest = { type: 'events'; route: Route; eventIds: readonly string[] };

export type SportsPageRequest = LiveRequest | CatalogRequest | ScopeRequest | SearchRequest;
export type SportsRequest = SportsPageRequest | EventsRequest;

// ============ Page Requests ================================================== //

/**
 * The browse or Search request for Sports and Predictions, kept separately for each screen.
 */
export const sportsPageRequestStores: Record<SportsHost, DerivedStore<SportsPageRequest | null>> = {
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
export function getRequestDestination(request: LiveRequest | ScopeRequest): SportsDestination {
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
      return eventId ? { type: 'events', route, eventIds: [eventId] } : null;
    }

    default:
      return null;
  }
});
