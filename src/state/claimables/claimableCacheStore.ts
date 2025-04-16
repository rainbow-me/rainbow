import { createRainbowStore } from '../internal/createRainbowStore';

interface ClaimableCacheStore {
  claimables: Map<string, number>;
  setClaimableIndex: (uniqueId: string, index: number) => void;
  getClaimableIndex: (uniqueId: string) => number | undefined;
  removeClaimable: (uniqueId: string) => void;
}

export const useClaimableCacheStore = createRainbowStore<ClaimableCacheStore>(
  (set, get) => ({
    claimables: new Map(),

    setClaimableIndex: (uniqueId, index) => {
      set(state => ({
        ...state,
        claimables: new Map(state.claimables).set(uniqueId, index),
      }));
    },

    getClaimableIndex: uniqueId => {
      return get().claimables.get(uniqueId);
    },

    removeClaimable: uniqueId => {
      set(state => {
        const newClaimables = new Map(state.claimables);
        newClaimables.delete(uniqueId);
        return {
          ...state,
          claimables: newClaimables,
        };
      });
    },
  }),
  {
    storageKey: 'claimableCacheStore',
    version: 1,
  }
);
