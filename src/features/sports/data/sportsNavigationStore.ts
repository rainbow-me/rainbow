import { createBaseStore, type Store } from '@storesjs/stores';

import { type SportsDestination, type SportsHost } from '@/features/sports/core/browse';

// ============ Navigation Store =============================================== //

type SportsNavigationState = {
  /** The destination whose category tab stays selected while the user browses from it. */
  category: SportsDestination;
  destination: SportsDestination;
  /** `null` while Search is closed, `''` while it is open and empty. */
  query: string | null;
  /**
   * Opens a destination, selects its category tab, and closes Search.
   */
  select: (destination: SportsDestination) => void;
  /**
   * Opens a destination within the selected category. From Search, closes Search and selects the destination's category.
   */
  open: (destination: SportsDestination) => void;
  search: (query: string | null) => void;
};

/**
 * Navigation state for Sports and Predictions, kept separately for each screen.
 */
export const sportsNavigationStores: Record<SportsHost, Store<SportsNavigationState>> = {
  main: createSportsNavigationStore(),
  predictions: createSportsNavigationStore(),
};

function createSportsNavigationStore(): Store<SportsNavigationState> {
  return createBaseStore<SportsNavigationState>(set => ({
    category: 'live',
    destination: 'live',
    query: null,

    select: destination =>
      set(state => {
        if (state.category === destination && state.destination === destination && state.query === null) return state;
        return { category: destination, destination, query: null };
      }),

    open: destination =>
      set(state => {
        if (state.query !== null) return { category: destination, destination, query: null };
        if (state.destination === destination) return state;
        return { destination };
      }),

    search: query =>
      set(state => {
        const text = query?.trim() ?? null;
        if (text === state.query) return state;
        return { query: text };
      }),
  }));
}
