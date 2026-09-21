import { createDerivedStore, getQueryKey } from '@storesjs/stores';

import {
  getSportsDestinationKey,
  getSportsNavigationRoot,
  getSportsParentDestination,
  type SportsDestination,
  type SportsHost,
} from '@/features/sports/core/browse';
import { type SportsScope } from '@/features/sports/core/catalog';
import { getSportsResult, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';

type SportsBrowse = {
  layout: 'directory' | 'live' | 'games' | 'search';
  directory: { type: 'sports' | 'competitions' | 'search'; scopeIds: string[] };
  scope: SportsScope | undefined;
  parent: SportsScope | undefined;
  back: SportsDestination | undefined;
  selectedCategory: string;
  categories: SportsDestination[];
};

type SportsReadStatus = 'none' | 'loading' | 'error' | 'empty' | 'search-empty' | 'more';

const EMPTY_IDS: string[] = [];
const DEFAULT_CATEGORIES: SportsDestination[] = [{ type: 'live' }, { type: 'all' }];

export const sportsBrowseStores = {
  main: createSportsBrowse('main'),
  predictions: createSportsBrowse('predictions'),
};

export const sportsReadStatusStores = {
  main: createSportsReadStatus('main'),
  predictions: createSportsReadStatus('predictions'),
};

function createSportsBrowse(host: SportsHost) {
  return createDerivedStore<SportsBrowse>(
    $ => {
      const catalog = $(useSportsStore, state => state.catalog);
      const { destination, query } = $(useSportsViewStore, state => state.hosts[host].request);
      const navigationRoot = $(useSportsViewStore, state => state.hosts[host].navigationRoot);
      const scope = destination.type === 'scope' ? catalog?.scopes[destination.scopeId] : undefined;
      const directoryIds = destination.type === 'all' ? catalog?.sportIds : scope?.directoryIds;
      let layout: SportsBrowse['layout'] = 'games';
      if (query !== null) layout = 'search';
      else if (destination.type === 'live') layout = 'live';
      else if (destination.type === 'all' || directoryIds) layout = 'directory';
      let directory: SportsBrowse['directory'];
      if (query !== null) {
        const text = query.toLocaleLowerCase();
        directory = {
          type: 'search',
          scopeIds: text ? (catalog?.scopeIds.filter(id => catalog.scopes[id]?.searchName.includes(text)) ?? EMPTY_IDS) : EMPTY_IDS,
        };
      } else {
        directory = { type: destination.type === 'all' ? 'sports' : 'competitions', scopeIds: directoryIds ?? EMPTY_IDS };
      }
      return {
        layout,
        directory,
        scope,
        parent: scope?.parentId ? catalog?.scopes[scope.parentId] : undefined,
        back: getSportsParentDestination(catalog, destination, navigationRoot),
        selectedCategory: getSportsDestinationKey(getSportsNavigationRoot(catalog, navigationRoot)),
        categories: catalog?.categories ?? DEFAULT_CATEGORIES,
      };
    },
    { lockDependencies: true }
  );
}

function createSportsReadStatus(host: SportsHost) {
  return createDerivedStore<SportsReadStatus>($ => {
    const request = $(useSportsViewStore, state => state.hosts[host].request);
    const window = $(useSportsViewStore, state => state.window);
    const layout = $(sportsBrowseStores[host], state => state.layout);
    const queryRequest =
      request.query === null
        ? { type: 'browse' as const, destination: request.destination }
        : { type: 'search' as const, query: request.query };
    const queryKey = getQueryKey({ request: queryRequest, window });
    const hasError = $(useSportsStore, state => Boolean(state.queryCache[queryKey]?.errorInfo?.error));
    const hasResult = $(useSportsStore, state => getSportsResult(state, request) !== undefined);
    const hasGames = $(useSportsStore, state => Boolean(getSportsResult(state, request)?.sections.length));
    const hasMore = $(useSportsStore, state => Boolean(getSportsResult(state, request)?.nextCursor));
    const hasCatalog = $(useSportsStore, state => state.catalog !== undefined);

    if (request.query === '') return 'none';
    if (hasError) return 'error';
    if (hasMore) return 'more';
    if (hasGames) return 'none';
    if (layout === 'directory') return hasCatalog ? 'none' : 'loading';
    if (!hasResult) return 'loading';
    return layout === 'search' ? 'search-empty' : 'empty';
  });
}
