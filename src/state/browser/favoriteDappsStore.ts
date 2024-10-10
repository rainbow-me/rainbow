import { analyticsV2 } from '@/analytics';
import { createRainbowStore } from '../internal/createRainbowStore';

export interface FavoritedSite {
  name: string;
  url: string;
  image: string;
}

interface FavoriteDappsStore {
  favoriteDapps: FavoritedSite[];
  addFavorite: (site: FavoritedSite) => void;
  getFavorites: (sort?: FavoritedSite['url'][]) => FavoritedSite[];
  getOrderedIds: () => FavoritedSite['url'][];
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
  reorderFavorites: (newOrder: FavoritedSite['url'][]) => void;
}

/**
 * Strips a URL down from e.g. `https://www.rainbow.me/app/` to `rainbow.me/app`.
 * @param stripPath - Optionally strip the path from the URL, leaving `rainbow.me`.
 */
export const standardizeUrl = (url: string, stripPath?: boolean) => {
  let standardizedUrl = url?.trim();
  standardizedUrl = standardizedUrl?.replace(/^https?:\/\//, '');
  standardizedUrl = standardizedUrl?.replace(/^www\./, '');
  if (standardizedUrl?.endsWith('/')) {
    standardizedUrl = standardizedUrl?.slice(0, -1);
  }
  if (standardizedUrl?.includes('?')) {
    standardizedUrl = standardizedUrl?.split('?')[0];
  }
  if (stripPath) {
    standardizedUrl = standardizedUrl?.split('/')?.[0] || standardizedUrl;
  }
  return standardizedUrl;
};

export const useFavoriteDappsStore = createRainbowStore<FavoriteDappsStore>(
  (set, get) => ({
    favoriteDapps: [],

    addFavorite: site => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(site.url);

      if (!favoriteDapps.some(dapp => dapp.url === standardizedUrl)) {
        analyticsV2.track(analyticsV2.event.browserAddFavorite, { url: standardizedUrl, image: site.image, name: site.name });

        set({ favoriteDapps: [...favoriteDapps, { ...site, url: standardizedUrl }] });
      }
    },

    getFavorites: sort => {
      const { favoriteDapps } = get();
      if (!sort) return favoriteDapps;

      const sortMap = new Map(sort.map((url, index) => [url, index]));

      return [...favoriteDapps].sort((a, b) => {
        const indexA = sortMap.get(a.url) ?? Infinity;
        const indexB = sortMap.get(b.url) ?? Infinity;
        return indexA - indexB;
      });
    },

    getOrderedIds: () => get().favoriteDapps.map(dapp => dapp.url),

    isFavorite: url => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(url);
      const foundMatch = favoriteDapps.some(dapp => dapp.url === standardizedUrl);
      if (foundMatch) return true;

      const baseUrl = standardizeUrl(url, true);
      return favoriteDapps.some(dapp => dapp.url.startsWith(baseUrl));
    },

    removeFavorite: url => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(url);
      const match = favoriteDapps.find(dapp => dapp.url === standardizedUrl);

      if (match) {
        set({ favoriteDapps: favoriteDapps.filter(dapp => dapp.url !== standardizedUrl) });
      } else {
        const baseUrl = standardizeUrl(url, true);
        const baseUrlMatch = favoriteDapps.find(dapp => dapp.url.startsWith(baseUrl));
        if (baseUrlMatch) {
          set({ favoriteDapps: favoriteDapps.filter(dapp => dapp.url !== baseUrlMatch.url) });
        }
      }
    },

    reorderFavorites: newOrder => {
      const { favoriteDapps } = get();
      const urlMap = new Map(favoriteDapps.map(dapp => [dapp.url, dapp]));
      const reorderedFavorites = newOrder.map(url => urlMap.get(url)).filter((dapp): dapp is FavoritedSite => dapp !== undefined);
      const remainingFavorites = favoriteDapps.filter(dapp => !newOrder.includes(dapp.url));
      set({ favoriteDapps: [...reorderedFavorites, ...remainingFavorites] });
    },
  }),
  {
    storageKey: 'browserFavorites',
    version: 1,
  }
);
