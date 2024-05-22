import { createRainbowStore } from '../internal/createRainbowStore';

export interface Site {
  name: string;
  url: string;
  image: string;
  screenshot?: string;
  timestamp: number;
}

interface BrowserHistoryStore {
  recents: Site[];
  addRecent: (site: Site) => void;
}

const MAX_RECENT_SIZE = 1000;

export const useBrowserHistoryStore = createRainbowStore<BrowserHistoryStore & { hasVisited: (url: string) => boolean }>(
  (set, get) => ({
    recents: [],

    addRecent: (site: Site) => {
      set(state => {
        let newRecents = [site, ...state.recents];
        if (newRecents.length > MAX_RECENT_SIZE) {
          newRecents = newRecents.slice(0, MAX_RECENT_SIZE);
        }
        return { recents: newRecents };
      });
    },
    hasVisited: (url: string) => {
      const state = get();
      return state.recents.some((site: { url: string }) => site.url === url);
    },
  }),
  {
    storageKey: 'browserHistory',
    version: 0,
  }
);
