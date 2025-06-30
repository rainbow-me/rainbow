import { Address } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { OpenCollectionsState, OpenCollectionsStoreType, CollectionId } from './types';

const MAX_OPEN_COLLECTIONS = 20;

export const createOpenCollectionsStore = (address: Address | string): OpenCollectionsStoreType =>
  createRainbowStore<OpenCollectionsState>(
    (set, get) => ({
      openCollections: { showcase: true },
      insertionOrder: ['showcase'],

      toggleCollection: (collectionName: CollectionId) => {
        set(state => {
          const lowerCaseCollectionName = collectionName.toLowerCase();
          const isCurrentlyOpen = state.openCollections[lowerCaseCollectionName];

          if (isCurrentlyOpen) {
            const newOpenCollections = { ...state.openCollections };
            delete newOpenCollections[lowerCaseCollectionName];

            const newInsertionOrder = state.insertionOrder.filter(id => id !== lowerCaseCollectionName);

            return {
              openCollections: newOpenCollections,
              insertionOrder: newInsertionOrder,
            };
          } else {
            const newOpenCollections = { ...state.openCollections };
            let newInsertionOrder = [...state.insertionOrder];

            const nonShowcaseOrder = newInsertionOrder.filter(id => id !== 'showcase');

            if (nonShowcaseOrder.length >= MAX_OPEN_COLLECTIONS && lowerCaseCollectionName !== 'showcase') {
              const oldestNonShowcase = nonShowcaseOrder[0];
              delete newOpenCollections[oldestNonShowcase];
              newInsertionOrder = newInsertionOrder.filter(id => id !== oldestNonShowcase);
            }

            newOpenCollections[lowerCaseCollectionName] = true;
            newInsertionOrder.push(lowerCaseCollectionName);

            return {
              openCollections: newOpenCollections,
              insertionOrder: newInsertionOrder,
            };
          }
        });
      },

      setCollectionOpen: (collectionName: CollectionId, isOpen: boolean) => {
        set(state => {
          const lowerCaseCollectionName = collectionName.toLowerCase();

          if (!isOpen) {
            const newOpenCollections = { ...state.openCollections };
            delete newOpenCollections[lowerCaseCollectionName];

            const newInsertionOrder = state.insertionOrder.filter(id => id !== lowerCaseCollectionName);

            return {
              openCollections: newOpenCollections,
              insertionOrder: newInsertionOrder,
            };
          }

          if (state.openCollections[lowerCaseCollectionName]) {
            return state;
          }

          const newOpenCollections = { ...state.openCollections };
          let newInsertionOrder = [...state.insertionOrder];

          const nonShowcaseOrder = newInsertionOrder.filter(id => id !== 'showcase');

          if (nonShowcaseOrder.length >= MAX_OPEN_COLLECTIONS && lowerCaseCollectionName !== 'showcase') {
            const oldestNonShowcase = nonShowcaseOrder[0];
            delete newOpenCollections[oldestNonShowcase];
            newInsertionOrder = newInsertionOrder.filter(id => id !== oldestNonShowcase);
          }

          newOpenCollections[lowerCaseCollectionName] = isOpen;
          newInsertionOrder.push(lowerCaseCollectionName);

          return {
            openCollections: newOpenCollections,
            insertionOrder: newInsertionOrder,
          };
        });
      },

      isCollectionOpen: (collectionName: CollectionId) => {
        return get().openCollections[collectionName.toLowerCase()] ?? false;
      },
    }),
    {
      storageKey: `open-collections_${address.toLowerCase()}`,
      version: 1,
      partialize: state => ({
        openCollections: state.openCollections,
        insertionOrder: state.insertionOrder,
      }),
    }
  ) as OpenCollectionsStoreType;
