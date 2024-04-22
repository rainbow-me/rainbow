import create from 'zustand';

import { createStore } from '../internal/createStore';

export interface Site {
  name: string;
  url: string;
  image: string;
  screenshot?: string;
  timestamp: number;
}

interface BrowserHistoryStore {
  recent: Site[];
  addRecent: (site: Site) => void;
  getRecent: () => Site[];
}

const MAX_RECENT_SIZE = 1000;

export const browserHistoryStore = createStore<BrowserHistoryStore>((set, get) => ({
  recent: [],
  addRecent: (site: Site) => {
    let newRecents = [site, ...get().recent];
    if (newRecents.length > MAX_RECENT_SIZE) {
      newRecents = newRecents.slice(0, MAX_RECENT_SIZE);
    }

    set({
      recent: newRecents,
    });
  },
  getRecent: () => get().recent,
}));

export const useBrowserHistoryStore = create(browserHistoryStore);
