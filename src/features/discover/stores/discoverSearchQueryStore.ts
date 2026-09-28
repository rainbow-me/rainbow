import { createBaseStore } from '@storesjs/stores';

type DiscoverSearchQueryState = {
  isSearching: boolean;
  searchQuery: string;
};

export const useDiscoverSearchQueryStore = createBaseStore<DiscoverSearchQueryState>(() => ({ isSearching: false, searchQuery: '' }));
