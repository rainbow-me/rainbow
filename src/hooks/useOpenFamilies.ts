import { useCallback, useMemo } from 'react';
import { MMKV } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
const mmkv = new MMKV();

export default function useOpenFamilies() {
  const { accountAddress } = useAccountSettings();
  const openFamilies = useOpenFamiliesStore(s => s.getOpenFamilies(accountAddress));
  const setOpenFamilies = useOpenFamiliesStore(s => s.updateOpenFamilies);

  const updateOpenFamilies = useCallback(
    (value: Record<string, boolean>) => setOpenFamilies(accountAddress, value),
    [accountAddress, setOpenFamilies]
  );

  const openFamiliesWithDefault = useMemo(
    () => ({
      Showcase: true,
      ...(openFamilies || {}),
    }),
    [openFamilies]
  ) as Record<string, boolean>;

  return {
    openFamilies: openFamiliesWithDefault,
    updateOpenFamilies,
  };
}

type OpenFamiliesStore = {
  openFamilies: Record<string, Record<string, boolean>>;
  getOpenFamilies: (address?: string) => Record<string, boolean>;
  updateOpenFamilies: (address: string, updates: Record<string, boolean>) => void;
  getOpenFamilyNames: () => string[];
};

// Migration function to populate the store from MMKV
const migrateFromMMKV = () => {
  const allKeys = mmkv.getAllKeys();
  const openFamiliesKeys = allKeys.filter(key => key.startsWith('open-families-'));

  const migratedData: Record<string, Record<string, boolean>> = {};

  openFamiliesKeys.forEach(key => {
    const address = key.replace('open-families-', '');
    const stored = mmkv.getString(key);
    if (stored) {
      try {
        const parsedData = JSON.parse(stored);
        migratedData[address] = parsedData;
      } catch (e) {
        console.error(`Failed to parse MMKV data for key ${key}:`, e);
      }
    }
  });

  return { openFamilies: migratedData } as Partial<OpenFamiliesStore>;
};

export const useOpenFamiliesStore = createRainbowStore<OpenFamiliesStore>(
  (set, get) => ({
    openFamilies: {},
    getOpenFamilies: (address?: string) => {
      if (!address) {
        return { Showcase: true };
      }
      const state = get();
      return state.openFamilies?.[address];
    },
    updateOpenFamilies: (address, updates) => {
      const state = get();
      console.log('UPDATE OPEN FAMILIES', address, updates);
      set({
        ...state,
        openFamilies: {
          ...state.openFamilies,
          [address]: {
            ...(state.openFamilies[address] || {}),
            ...updates,
          },
        },
      });
    },
    getOpenFamilyNames: () => {
      const address = userAssetsStoreManager.getState().address;
      const openFamiliesDict = get().getOpenFamilies(address || '');
      const expandedFamilies = Object.entries(openFamiliesDict || {}).reduce((acc, [key, value]) => {
        if (value) {
          acc.push(key);
        }
        return acc;
      }, [] as string[]);
      return expandedFamilies;
    },
  }),
  {
    storageKey: 'openFamilies',
    version: 0,
    migrate: persistedState => {
      if (!persistedState) {
        return migrateFromMMKV();
      }
      return persistedState as OpenFamiliesStore;
    },
  }
);
