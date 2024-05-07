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

export const useBrowserHistoryStore = createRainbowStore<BrowserHistoryStore>(
  set => ({
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
  }),
  {
    storageKey: 'browserHistory',
    version: 0,
  }
);
