import { CollectionId } from '@/state/nfts/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

type OpenCollectionsState = {
  openCollections: Record<CollectionId, boolean>;
  toggleCollection: (collectionId: CollectionId) => void;
  isCollectionOpen: (collectionId: CollectionId) => boolean;
  setCollectionOpen: (collectionId: CollectionId, isOpen: boolean) => void;
};

export const useOpenCollectionsStore = createRainbowStore<OpenCollectionsState>(
  (set, get) => ({
    openCollections: { showcase: true },

    toggleCollection: collectionName => {
      set(state => {
        const lowerCaseCollectionName = collectionName.toLowerCase();
        const newOpenCollections = {
          ...state.openCollections,
          [lowerCaseCollectionName]: !state.openCollections[lowerCaseCollectionName],
        };
        return { openCollections: newOpenCollections };
      });
    },

    setCollectionOpen: (collectionName, isOpen) => {
      set(state => {
        const newOpenCollections = {
          ...state.openCollections,
          [collectionName.toLowerCase()]: isOpen,
        };
        return { openCollections: newOpenCollections };
      });
    },

    isCollectionOpen: collectionName => {
      return get().openCollections[collectionName.toLowerCase()] ?? false;
    },
  }),
  {
    storageKey: 'open-collections',
    version: 1,
    partialize: state => ({
      openCollections: state.openCollections,
    }),
  }
);

export type OpenCollectionsStore = typeof useOpenCollectionsStore;
