import useAccountSettings from '@/hooks/useAccountSettings';
import { logger } from '@/logger';
import { noop } from 'lodash';
import React, { createContext, useCallback, useContext } from 'react';
import { MMKV } from 'react-native-mmkv';
import { makeMutable, runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';
import { Address } from 'viem';

const mmkv = new MMKV();

type CollectionName = string | 'showcase';

export type CollectiblesContextType = {
  openedCollections: SharedValue<Record<CollectionName, boolean>>;
  toggleCollection: (collectionName: CollectionName) => void;
};

const DEFAULT_OPEN_COLLECTIONS: Record<CollectionName, boolean> = {
  Showcase: true,
};

const getInitialOpenCollections = (accountAddress: Address) => {
  try {
    const openCollections = mmkv.getString(`open-families-${accountAddress}`);
    return openCollections ? JSON.parse(openCollections) : DEFAULT_OPEN_COLLECTIONS;
  } catch (error) {
    logger.warn('Failed to get open collections initial state', { error });
    return DEFAULT_OPEN_COLLECTIONS;
  }
};

export const CollectiblesContext = createContext<CollectiblesContextType>({
  openedCollections: makeMutable({}),
  toggleCollection: noop,
});

export const CollectiblesProvider = ({ children }: { children: React.ReactNode }) => {
  const { accountAddress } = useAccountSettings();
  const openedCollections = useSharedValue(getInitialOpenCollections(accountAddress));

  const persistOpenCollections = useCallback(
    (data: Record<CollectionName, boolean>) => {
      mmkv.set(`open-families-${accountAddress}`, JSON.stringify(data));
    },
    [accountAddress]
  );

  const toggleCollection = useCallback(
    (collectionName: CollectionName) => {
      'worklet';
      openedCollections.modify(collections => ({
        ...collections,
        [collectionName]: !collections[collectionName],
      }));

      runOnJS(persistOpenCollections)(openedCollections.value);
    },
    [openedCollections, accountAddress]
  );

  return <CollectiblesContext.Provider value={{ openedCollections, toggleCollection }}>{children}</CollectiblesContext.Provider>;
};

export const useCollectiblesContext = () => {
  return useContext(CollectiblesContext);
};
