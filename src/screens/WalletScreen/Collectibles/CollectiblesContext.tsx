import { noop } from 'lodash';
import React, { createContext, useCallback, useContext } from 'react';
import { makeMutable, SharedValue, useSharedValue } from 'react-native-reanimated';

type CollectionName = string | 'showcase';

export type CollectiblesContextType = {
  openedCollections: SharedValue<Record<CollectionName, boolean>>;
  toggleCollection: (collectionName: CollectionName) => void;
};

const DEFAULT_OPEN_COLLECTIONS: Record<CollectionName, boolean> = {
  showcase: true,
};

export const CollectiblesContext = createContext<CollectiblesContextType>({
  openedCollections: makeMutable({}),
  toggleCollection: noop,
});

export const CollectiblesProvider = ({ children }: { children: React.ReactNode }) => {
  const openedCollections = useSharedValue(DEFAULT_OPEN_COLLECTIONS);

  const toggleCollection = useCallback((collectionName: CollectionName) => {
    'worklet';
    openedCollections.modify(collections => ({
      ...collections,
      [collectionName]: !collections[collectionName],
    }));
  }, []);

  return <CollectiblesContext.Provider value={{ openedCollections, toggleCollection }}>{children}</CollectiblesContext.Provider>;
};

export const useCollectiblesContext = () => {
  return useContext(CollectiblesContext);
};
