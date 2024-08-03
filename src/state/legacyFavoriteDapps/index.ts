import create from 'zustand';
import { standardizeUrl } from '../favoriteDapps/favoriteDapps';
import { createStore } from '../internal/createStore';

interface Site {
  name: string;
  url: string;
  image: string;
}

interface LegacyFavoriteDappsStore {
  favoriteDapps: Site[];
  addFavorite: (site: Site) => void;
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
}

export const legacyFavoriteDappsStore = createStore<LegacyFavoriteDappsStore>(
  (set, get) => ({
    favoriteDapps: [],

    addFavorite: site => {
      const { favoriteDapps } = get();
      const standardizedUrl = standardizeUrl(site.url);

      if (!favoriteDapps.some(dapp => dapp.url === standardizedUrl)) {
        set({ favoriteDapps: [...favoriteDapps, { ...site, url: standardizedUrl }] });
      }
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
  }),
  {
    persist: {
      name: 'favoriteDapps',
      version: 2,
    },
  }
);

export const useLegacyFavoriteDappsStore = create(legacyFavoriteDappsStore);
