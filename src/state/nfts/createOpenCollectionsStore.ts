import { Address, isAddress } from 'viem';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { OpenCollectionsState, OpenCollectionsStoreType } from './types';
import { parseUniqueId } from '@/resources/nfts/utils';

const MAX_OPEN_COLLECTIONS = 20;

export const createOpenCollectionsStore = (address: Address | string): OpenCollectionsStoreType =>
  createRainbowStore<OpenCollectionsState>(
    (set, get) => ({
      openCollections: { showcase: true },
      insertionOrder: ['showcase'],

      toggleCollection: collectionIdOrLegacyName => {
        set(state => {
          const normalizedKey = collectionIdOrLegacyName.toLowerCase();
          const { network, contractAddress } = parseUniqueId(normalizedKey);
          const isNewFormat = !!network && isAddress(contractAddress);

          // Skip all insertion order logic for legacy collections
          if (!isNewFormat) {
            return {
              ...state,
              openCollections: {
                ...state.openCollections,
                [normalizedKey]: !state.openCollections[normalizedKey],
              },
            };
          }

          const isCurrentlyOpen = state.openCollections[normalizedKey];

          if (isCurrentlyOpen) {
            const newOpenCollections = { ...state.openCollections };
            delete newOpenCollections[normalizedKey];

            const newInsertionOrder = state.insertionOrder.filter(id => id !== normalizedKey);

            return {
              ...state,
              openCollections: newOpenCollections,
              insertionOrder: newInsertionOrder,
            };
          } else {
            const newOpenCollections = { ...state.openCollections };
            let newInsertionOrder = [...state.insertionOrder];

            const nonShowcaseOrder = newInsertionOrder.filter(id => id !== 'showcase');

            if (nonShowcaseOrder.length >= MAX_OPEN_COLLECTIONS && normalizedKey !== 'showcase') {
              const oldestNonShowcase = nonShowcaseOrder[0];
              delete newOpenCollections[oldestNonShowcase];
              newInsertionOrder = newInsertionOrder.filter(id => id !== oldestNonShowcase);
            }

            newOpenCollections[normalizedKey] = true;
            newInsertionOrder.push(normalizedKey);

            return {
              ...state,
              openCollections: newOpenCollections,
              insertionOrder: newInsertionOrder,
            };
          }
        });
      },

      setCollectionOpen: (collectionIdOrLegacyName, isOpen) => {
        set(state => {
          const normalizedKey = collectionIdOrLegacyName.toLowerCase();
          const { network, contractAddress } = parseUniqueId(normalizedKey);
          const isNewFormat = !!network && isAddress(contractAddress);

          // Skip all insertion order logic for legacy collections
          if (!isNewFormat) {
            return {
              ...state,
              openCollections: {
                ...state.openCollections,
                [normalizedKey]: isOpen,
              },
            };
          }

          if (!isOpen) {
            const newOpenCollections = { ...state.openCollections };
            delete newOpenCollections[normalizedKey];

            const newInsertionOrder = state.insertionOrder.filter(id => id !== normalizedKey);

            return {
              openCollections: newOpenCollections,
              insertionOrder: newInsertionOrder,
            };
          }

          if (state.openCollections[normalizedKey]) {
            return state;
          }

          const newOpenCollections = { ...state.openCollections };
          let newInsertionOrder = [...state.insertionOrder];

          const nonShowcaseOrder = newInsertionOrder.filter(id => id !== 'showcase');

          if (nonShowcaseOrder.length >= MAX_OPEN_COLLECTIONS && normalizedKey !== 'showcase') {
            const oldestNonShowcase = nonShowcaseOrder[0];
            delete newOpenCollections[oldestNonShowcase];
            newInsertionOrder = newInsertionOrder.filter(id => id !== oldestNonShowcase);
          }

          newOpenCollections[normalizedKey] = isOpen;
          newInsertionOrder.push(normalizedKey);

          return {
            openCollections: newOpenCollections,
            insertionOrder: newInsertionOrder,
          };
        });
      },

      isCollectionOpen: collectionIdOrLegacyName => {
        return get().openCollections[collectionIdOrLegacyName.toLowerCase()] ?? false;
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
