import { StateStorage } from 'zustand/middleware';
import { zustandStorage } from '@/storage/legacy';

/**
 * @deprecated This is a legacy API. Do not use unless working with the legacy `createStore`.
 */
export const persistStorage: StateStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return zustandStorage.get([key]);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await zustandStorage.set([key], value);
  },
  removeItem: async (key: string): Promise<void> => {
    await zustandStorage.remove([key]);
  },
};
