import { createBaseStore, createDerivedStore } from '@storesjs/stores';

import { useDiscoverNavigationStore, type DiscoverSection } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';

type EventLists = {
  lists: Partial<Record<string, readonly string[]>>;
  eventIds: readonly string[];
};

type DiscoverEventListsState = {
  sections: Partial<Record<DiscoverSection, EventLists>>;
  mountedEventIds: ReadonlySet<string>;
  setList: (section: DiscoverSection, listId: string, eventIds: readonly string[]) => void;
  removeList: (section: DiscoverSection, listId: string) => void;
};

const NO_IDS: readonly string[] = [];

/**
 * The event IDs in Discover's mounted lists, grouped by page and combined across pages. Card order is ignored.
 */
export const discoverEventListsStore = createBaseStore<DiscoverEventListsState>((set, get) => ({
  sections: {},
  mountedEventIds: new Set(),

  setList: (section, listId, ids) =>
    set(state => {
      const previous = state.sections[section];
      const previousIds = previous?.lists[listId] ?? NO_IDS;
      if (areArraysEqual(previousIds, ids)) return state;

      const eventIds = new Set(ids);
      if (previousIds.length === eventIds.size && previousIds.every(id => eventIds.has(id))) return state;

      const lists = { ...previous?.lists };
      if (eventIds.size) lists[listId] = eventIds.size === ids.length ? ids : [...eventIds];
      else delete lists[listId];

      const pageIds = collectEventIds(Object.values(lists));
      const previousPageIds = previous?.eventIds ?? NO_IDS;
      const pageUnchanged = previousPageIds.length === pageIds.size && previousPageIds.every(id => pageIds.has(id));
      const sections = { ...state.sections };

      if (pageIds.size) {
        sections[section] = { lists, eventIds: pageUnchanged ? previousPageIds : [...pageIds].sort() };
      } else {
        delete sections[section];
      }

      if (pageUnchanged) return { sections };

      const mountedEventIds = collectEventIds(Object.values(sections).map(page => page?.eventIds));
      return {
        sections,
        mountedEventIds: areEventSetsEqual(state.mountedEventIds, mountedEventIds) ? state.mountedEventIds : mountedEventIds,
      };
    }),

  removeList: (section, listId) => get().setList(section, listId, NO_IDS),
}));

/**
 * The selected Discover page's rendered events, or no events while Search is open.
 */
export const displayedDiscoverEventIdsStore = createDerivedStore($ => {
  if ($(useDiscoverSearchQueryStore, state => state.isSearching)) return NO_IDS;

  const section = $(useDiscoverNavigationStore, state => state.activeSection);
  return $(discoverEventListsStore, state => state.sections[section]?.eventIds ?? NO_IDS);
});

function collectEventIds(lists: readonly (readonly string[] | undefined)[]): Set<string> {
  const eventIds = new Set<string>();

  for (const ids of lists) {
    for (const id of ids ?? NO_IDS) eventIds.add(id);
  }

  return eventIds;
}

function areEventSetsEqual(first: ReadonlySet<string>, second: ReadonlySet<string>): boolean {
  if (first.size !== second.size) return false;

  for (const id of first) {
    if (!second.has(id)) return false;
  }

  return true;
}
