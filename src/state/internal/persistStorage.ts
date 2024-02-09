import { zustandStorage } from '@/storage/legacy';
import { StateStorage } from 'zustand/middleware';

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
