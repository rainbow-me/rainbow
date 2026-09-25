import { createDerivedStore, type DerivedStore, type DeriveGetter } from '@storesjs/stores';

import { getSportsBackDestination, getSportsCategory, type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { type SportsCatalog, type SportsScope } from '@/features/sports/core/catalog';
import { areSectionInputsEqual, selectSportsGames, type SportsSection } from '@/features/sports/core/sections';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { getRequestDestination, sportsPageRequestStores, type SportsPageRequest } from '@/features/sports/data/sportsRequestStore';
import { getGames, getPageQueryKey, useSportsStore } from '@/features/sports/data/sportsStore';

// ============ Types ========================================================== //

export type SportsPage = 'live' | 'sports' | 'competitions' | 'games' | 'search';
type SportsPageStatus = 'none' | 'loading' | 'error' | 'empty' | 'search-empty' | 'more';

type SportsPageState = {
  page: SportsPage;
  scope: SportsScope | undefined;
  parent: SportsScope | undefined;
  back: SportsDestination | undefined;
  selectedCategory: SportsDestination;
  categories: SportsDestination[];
  directoryIds: string[];
  sections: SportsSection[];
};

// ============ Constants ====================================================== //

const EMPTY_IDS: string[] = [];
const EMPTY_SECTIONS: SportsSection[] = [];
const DEFAULT_CATEGORIES: SportsDestination[] = ['live', 'all'];

// ============ Page Stores ==================================================== //

/**
 * What each host's page shows. Score-only updates do not regroup its sections.
 */
export const sportsPageStores: Record<SportsHost, DerivedStore<SportsPageState>> = {
  main: createSportsPageStore('main'),
  predictions: createSportsPageStore('predictions'),
};

/**
 * The footer each host's page shows below its sections, from the page's own request.
 */
export const sportsPageStatusStores: Record<SportsHost, DerivedStore<SportsPageStatus>> = {
  main: createSportsPageStatusStore('main'),
  predictions: createSportsPageStatusStore('predictions'),
};

function createSportsPageStore(host: SportsHost): DerivedStore<SportsPageState> {
  return createDerivedStore($ => {
    const { category, destination, query } = $(sportsNavigationStores[host]);
    const request = $(sportsPageRequestStores[host], current => current);
    const catalog = $(useSportsStore, state => state.catalog);
    const scope = catalog?.scopes[destination];

    return {
      page: getPage(destination, query, scope),
      scope,
      parent: scope?.parentId ? catalog?.scopes[scope.parentId] : undefined,
      back: getSportsBackDestination(catalog, destination, category),
      selectedCategory: getSportsCategory(catalog, category),
      categories: catalog?.categories ?? DEFAULT_CATEGORIES,
      directoryIds: getDirectoryIds(catalog, destination, query),
      sections: getPageSections($, request, catalog),
    };
  });
}

function createSportsPageStatusStore(host: SportsHost): DerivedStore<SportsPageStatus> {
  return createDerivedStore($ => {
    const request = $(sportsPageRequestStores[host], current => current);
    if (!request) return 'none';

    const queryKey = getPageQueryKey(request);
    if ($(useSportsStore, state => Boolean(state.queryCache[queryKey]?.errorInfo))) return 'error';

    switch (request.type) {
      case 'search': {
        const result = $(useSportsStore, state => (state.search?.queryKey === queryKey ? state.search : undefined));
        if (!result) return 'loading';
        if (result.nextCursor) return 'more';
        return result.gameIds.length ? 'none' : 'search-empty';
      }

      case 'catalog':
        return $(useSportsStore, state => Boolean(state.catalog)) ? 'none' : 'loading';

      case 'live':
      case 'scope': {
        const showsContent = $(sportsPageStores[host], state => state.sections.length > 0 || state.page === 'competitions');
        if (showsContent) return 'none';

        const destination = getRequestDestination(request);
        return $(useSportsStore, state => state.results[destination]?.queryKey === queryKey) ? 'empty' : 'loading';
      }
    }
  });
}

// ============ Helpers ======================================================== //

function getPageSections($: DeriveGetter, request: SportsPageRequest | null, catalog: SportsCatalog | undefined): SportsSection[] {
  switch (request?.type) {
    case 'live':
    case 'scope': {
      const destination = getRequestDestination(request);
      const result = $(useSportsStore, state => state.results[destination]);
      if (!result) return EMPTY_SECTIONS;
      if (request.type === 'live' || result.queryKey === getPageQueryKey(request)) return result.sections;

      const games = $(
        useSportsStore,
        state => state.games,
        (previous, next) => areSectionInputsEqual(previous, next, result.gameIds)
      );
      return selectSportsGames(catalog, getGames(games, result.gameIds), request).sections;
    }

    case 'search': {
      const queryKey = getPageQueryKey(request);
      const gameIds = $(useSportsStore, state => (state.search?.queryKey === queryKey ? state.search.gameIds : undefined));
      return gameIds?.length ? [{ type: 'search', gameIds }] : EMPTY_SECTIONS;
    }

    default:
      return EMPTY_SECTIONS;
  }
}

function getPage(destination: SportsDestination, query: string | null, scope: SportsScope | undefined): SportsPage {
  if (query !== null) return 'search';
  if (destination === 'live') return 'live';
  if (destination === 'all') return 'sports';
  return scope?.directoryIds ? 'competitions' : 'games';
}

function getDirectoryIds(catalog: SportsCatalog | undefined, destination: SportsDestination, query: string | null): string[] {
  if (!catalog) return EMPTY_IDS;

  if (query !== null) {
    const text = query.toLocaleLowerCase();
    return text ? catalog.scopeIds.filter(id => catalog.scopes[id]?.searchName.includes(text)) : EMPTY_IDS;
  }

  if (destination === 'all') return catalog.sportIds;
  return catalog.scopes[destination]?.directoryIds ?? EMPTY_IDS;
}
