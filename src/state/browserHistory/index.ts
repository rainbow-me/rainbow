import { normalizeUrlForRecents } from '@/components/DappBrowser/utils';
import { createRainbowStore } from '../internal/createRainbowStore';
import { logger, RainbowError } from '@/logger';

export interface Site {
  name: string;
  url: string;
  image: string;
  screenshot?: string;
  timestamp: number;
}

export interface BrowserHistoryStore {
  recents: Site[];
  addRecent: (site: Site) => void;
  hasVisited: (url: string) => boolean;
  removeRecent: (url: string) => void;
}

const MAX_RECENT_SIZE = 1000;

export const useBrowserHistoryStore = createRainbowStore<BrowserHistoryStore>(
  (set, get) => ({
    recents: [],

    addRecent: (site: Site) => {
      set(state => {
        let url = site.url;

        if (url.startsWith('https://e.spindlembed.com/v1/redirect?')) {
          try {
            const urlObj = new URL(url);
            const redirectUrl = urlObj.searchParams.get('redirect_url');
            if (redirectUrl) {
              url = decodeURIComponent(redirectUrl);
            }
          } catch (error) {
            logger.error(new RainbowError('[browserHistory] Error parsing redirect URL'), {
              error,
            });
          }
        }

        const normalizedUrl = normalizeUrlForRecents(url);
        const updatedSite = { ...site, url: normalizedUrl };

        const newRecents = [updatedSite, ...state.recents.filter(s => s.url !== normalizedUrl)];
        if (newRecents.length > MAX_RECENT_SIZE) {
          return { recents: newRecents.slice(0, MAX_RECENT_SIZE) };
        }
        return { recents: newRecents };
      });
    },

    hasVisited: (url: string) => {
      const normalizedUrl = normalizeUrlForRecents(url);
      return get().recents.some(site => site.url === normalizedUrl);
    },

    removeRecent: (url: string) => {
      set(state => {
        const filteredRecents = state.recents.filter(site => site.url !== url);
        return { recents: filteredRecents };
      });
    },
  }),
  {
    storageKey: 'browserHistory',
    version: 0,
  }
);
