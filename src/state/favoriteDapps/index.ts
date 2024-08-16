import create from 'zustand';
import { createStore } from '../internal/createStore';

// need to combine types here
interface Site {
  name: string;
  url: string;
  image: string;
}

interface FavoriteDappsStore {
  favoriteDapps: Site[];
  addFavorite: (site: Site) => void;
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
}

const standardizeUrl = (url: string) => {
  // Strips the URL down from e.g. "https://www.rainbow.me/app/" to "rainbow.me/app"
  let standardizedUrl = url?.trim();
  standardizedUrl = standardizedUrl?.replace(/^https?:\/\//, '');
  standardizedUrl = standardizedUrl?.replace(/^www\./, '');
  if (standardizedUrl?.endsWith('/')) {
    standardizedUrl = standardizedUrl?.slice(0, -1);
  }
  return standardizedUrl;
};

export const favoriteDappsStore = createStore<FavoriteDappsStore>(
  (set, get) => ({
    favoriteDapps: [],
    addFavorite: site => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(site.url);

      if (!favoriteDapps.some(dapp => dapp.url === standardizedUrl)) {
        set({ favoriteDapps: [...favoriteDapps, { ...site, url: standardizedUrl }] });
      }
    },
    removeFavorite: url => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(url);
      set({ favoriteDapps: favoriteDapps.filter(dapp => dapp.url !== standardizedUrl) });
    },
    isFavorite: url => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(url);
      return favoriteDapps.some(dapp => dapp.url === standardizedUrl);
    },
  }),
  {
    persist: {
      name: 'favoriteDapps',
      version: 2,
    },
  }
);

export const useFavoriteDappsStore = create(favoriteDappsStore);
