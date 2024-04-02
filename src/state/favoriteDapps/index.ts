import create from 'zustand';
import { HTTPS } from '@/components/DappBrowser/constants';
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

const standardizeUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `${HTTPS}${url}`);

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
      version: 1,
    },
  }
);

export const useFavoriteDappsStore = create(favoriteDappsStore);
