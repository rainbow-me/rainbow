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
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
  reorderFavorites: (newOrder: FavoritedSite['url'][]) => void;
}

/** Strips a URL down from e.g. `https://www.rainbow.me/app/` to `rainbow.me/app` */
export const standardizeUrl = (url: string) => {
  let standardizedUrl = url?.trim();
  standardizedUrl = standardizedUrl?.replace(/^https?:\/\//, '');
  standardizedUrl = standardizedUrl?.replace(/^www\./, '');
  if (standardizedUrl?.endsWith('/')) {
    standardizedUrl = standardizedUrl?.slice(0, -1);
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

    isFavorite: url => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(url);
      return favoriteDapps.some(dapp => dapp.url === standardizedUrl);
    },

    removeFavorite: url => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(url);
      set({ favoriteDapps: favoriteDapps.filter(dapp => dapp.url !== standardizedUrl) });
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
