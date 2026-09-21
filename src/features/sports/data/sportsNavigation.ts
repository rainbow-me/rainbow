import { createDerivedStore } from '@storesjs/stores';

import {
  getSportsBackDestination,
  getSportsCategory,
  getSportsDestinationKey,
  type SportsDestination,
  type SportsHost,
} from '@/features/sports/core/browse';
import { type SportsScope } from '@/features/sports/core/catalog';
import { getSportsRequestKey, getSportsResult, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';

// ============ Navigation ==================================================== //

export type SportsPage = 'live' | 'sports' | 'competitions' | 'games' | 'search';

type SportsNavigation = {
  page: SportsPage;
  directoryIds: string[];
  scope: SportsScope | undefined;
  parent: SportsScope | undefined;
  back: SportsDestination | undefined;
  selectedCategory: string;
  categories: SportsDestination[];
};

const EMPTY_IDS: string[] = [];
const DEFAULT_CATEGORIES: SportsDestination[] = [{ type: 'live' }, { type: 'all' }];

export const sportsNavigationStores = {
  main: createSportsNavigation('main'),
  predictions: createSportsNavigation('predictions'),
};

function createSportsNavigation(host: SportsHost) {
  return createDerivedStore<SportsNavigation>(
    $ => {
      const catalog = $(useSportsStore, state => state.catalog);
      const { destination, query } = $(useSportsViewStore, state => state.hosts[host].request);
      const category = $(useSportsViewStore, state => state.hosts[host].category);
      const scope = destination.type === 'scope' ? catalog?.scopes[destination.scopeId] : undefined;

      const navigation = {
        scope,
        parent: scope?.parentId ? catalog?.scopes[scope.parentId] : undefined,
        back: getSportsBackDestination(catalog, destination, category),
        selectedCategory: getSportsDestinationKey(getSportsCategory(catalog, category)),
        categories: catalog?.categories ?? DEFAULT_CATEGORIES,
      };

      if (query !== null) {
        const text = query.toLocaleLowerCase();
        const directoryIds = text ? catalog?.scopeIds.filter(id => catalog.scopes[id]?.searchName.includes(text)) : undefined;
        return { ...navigation, page: 'search', directoryIds: directoryIds ?? EMPTY_IDS };
      }

      switch (destination.type) {
        case 'all':
          return { ...navigation, page: 'sports', directoryIds: catalog?.sportIds ?? EMPTY_IDS };
        case 'live':
          return { ...navigation, page: 'live', directoryIds: EMPTY_IDS };
        case 'scope':
          return { ...navigation, page: scope?.directoryIds ? 'competitions' : 'games', directoryIds: scope?.directoryIds ?? EMPTY_IDS };
      }
    },
    { lockDependencies: true }
  );
}

// ============ Request Status ================================================ //

type SportsReadStatus = 'none' | 'loading' | 'error' | 'empty' | 'search-empty' | 'more';

export const sportsReadStatusStores = {
  main: createSportsReadStatus('main'),
  predictions: createSportsReadStatus('predictions'),
};

function createSportsReadStatus(host: SportsHost) {
  return createDerivedStore<SportsReadStatus>($ => {
    const request = $(useSportsViewStore, state => state.hosts[host].request);
    const window = $(useSportsViewStore, state => state.window);
    const page = $(sportsNavigationStores[host], state => state.page);
    const key = getSportsRequestKey(request, window);

    return $(useSportsStore, state => {
      if (request.query === '') return 'none';
      if (state.queryCache[key]?.errorInfo?.error) return 'error';

      const result = getSportsResult(state, request);
      if (result?.nextCursor) return 'more';
      if (result?.sections.length) return 'none';
      if (page === 'sports' || page === 'competitions') return state.catalog ? 'none' : 'loading';
      if (!result) return 'loading';
      return page === 'search' ? 'search-empty' : 'empty';
    });
  });
}
