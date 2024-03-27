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

export const favoriteDappsStore = createStore<FavoriteDappsStore>(
  (set, get) => ({
    favoriteDapps: [],
    addFavorite: site => {
      const { favoriteDapps } = get();
      if (!favoriteDapps.some(dapp => dapp.url === site.url)) {
        set({ favoriteDapps: [...favoriteDapps, site] });
      }
    },
    removeFavorite: url => {
      const { favoriteDapps } = get();
      set({ favoriteDapps: favoriteDapps.filter(dapp => dapp.url !== url) });
    },
    isFavorite: url => {
      const { favoriteDapps } = get();
      return favoriteDapps.some(dapp => dapp.url === url);
    },
  }),
  {
    persist: {
      name: 'favoriteDapps',
      version: 1,
    },
  }
);

export const useFavoriteDappsStore = create(favoriteDappsStore);
