import { createDerivedStore, type DerivedStore, type DeriveGetter } from '@storesjs/stores';

import { getSportsBackDestination, getSportsCategory, type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { type SportsCatalog, type SportsScope } from '@/features/sports/core/catalog';
import { areSectionInputsEqual, groupSportsGames, type SportsSection } from '@/features/sports/core/sections';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { getRequestDestination, sportsPageRequestStores, type SportsPageRequest } from '@/features/sports/data/sportsRequestStore';
import { getPageQueryKey, useSportsStore, type SportsQueryState } from '@/features/sports/data/sportsStore';
import { sportsWindowStore } from '@/features/sports/data/sportsWindowStore';

// ============ Types ========================================================== //

/** The directory, browse, or Search presentation selected for a Sports host. */
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
  currentDay: string;
  sections: SportsSection[];
  getStatus: (state: SportsQueryState) => SportsPageStatus;
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

function createSportsPageStore(host: SportsHost): DerivedStore<SportsPageState> {
  const context = createDerivedStore(
    $ => {
      const { category, destination, query } = $(sportsNavigationStores[host], s => s);
      const request = $(sportsPageRequestStores[host], s => s);
      const catalog = $(useSportsStore, s => s.catalog);

      const scope = catalog?.scopes[destination];

      return {
        catalog,
        request,
        queryKey: request ? getPageQueryKey(request) : undefined,
        navigation: {
          page: getPage(destination, query, scope),
          scope,
          parent: scope?.parentId ? catalog?.scopes[scope.parentId] : undefined,
          back: getSportsBackDestination(catalog, destination, category),
          selectedCategory: getSportsCategory(catalog, category),
          categories: catalog?.categories ?? DEFAULT_CATEGORIES,
          directoryIds: getDirectoryIds(catalog, destination, query),
        },
      };
    },
    { lockDependencies: true }
  );

  return createDerivedStore($ => {
    const { catalog, request, queryKey, navigation } = $(context, s => s);
    const currentDay = $(sportsWindowStore, state => new Date(state.from).toDateString());
    const sections = request && queryKey ? getPageSections($, request, queryKey, catalog) : EMPTY_SECTIONS;

    return {
      ...navigation,
      currentDay,
      sections,
      getStatus: s => determineStatus(s, request, queryKey, navigation.page, sections),
    };
  });
}

// ============ Helpers ======================================================== //

function determineStatus(
  state: SportsQueryState,
  request: SportsPageRequest | null,
  queryKey: string | undefined,
  page: SportsPage,
  sections: readonly SportsSection[]
): SportsPageStatus {
  if (!request || !queryKey) return 'none';

  if (state.queryCache[queryKey]?.errorInfo) return 'error';

  if (request.type === 'search') {
    const result = state.search?.queryKey === queryKey ? state.search : undefined;
    if (!result) return 'loading';
    if (result.nextCursor) return 'more';

    return result.gameIds.length ? 'none' : 'search-empty';
  }

  if (request.type === 'catalog') return state.catalog ? 'none' : 'loading';
  if (page === 'competitions') return 'none';

  const result = state.results[getRequestDestination(request)];
  if ((result && sections.length) || sections.some(section => section.type === 'today' || section.type === 'upcoming')) {
    return 'none';
  }

  return result?.queryKey === queryKey ? 'empty' : 'loading';
}

function getPageSections(
  $: DeriveGetter,
  request: SportsPageRequest,
  queryKey: string,
  catalog: SportsCatalog | undefined
): SportsSection[] {
  switch (request.type) {
    case 'live':
      return $(useSportsStore, s => s.results.live?.sections) ?? EMPTY_SECTIONS;

    case 'scope': {
      const sections = $(useSportsStore, state => {
        const result = state.results[request.scopeId];
        return result?.queryKey === queryKey ? result.sections : undefined;
      });
      if (sections) return sections;

      // A stale result keeps its query's order. Before a first answer, borrow one containing page's sequence.
      const parentId = catalog?.scopes[request.scopeId]?.parentId;
      const gameIds = $(
        useSportsStore,
        state =>
          state.results[request.scopeId]?.gameIds ??
          (parentId ? state.results[parentId]?.gameIds : undefined) ??
          state.results.live?.gameIds
      );
      if (!gameIds) return EMPTY_SECTIONS;

      const games = $(
        useSportsStore,
        state => state.games,
        (previous, next) => areSectionInputsEqual(previous, next, gameIds)
      );
      const preview = groupSportsGames(catalog, games, gameIds, request);
      return preview.length ? preview : EMPTY_SECTIONS;
    }

    case 'search': {
      const gameIds = $(useSportsStore, s => (s.search?.queryKey === queryKey ? s.search.gameIds : undefined));
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

  return destination === 'all' ? catalog.sportIds : (catalog.scopes[destination]?.directoryIds ?? EMPTY_IDS);
}
