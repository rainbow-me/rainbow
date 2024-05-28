import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';

export interface UserAssetsState {
  userAssets: Map<UniqueId, ParsedSearchAsset>;

  hasUserAsset: (uniqueId: UniqueId) => boolean;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset;
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = Omit<Partial<UserAssetsState>, 'userAssets'> & {
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
};

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    const transformedStateToPersist: UserAssetsStateWithTransforms = {
      ...state,
      userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for user assets storage'), { error });
    throw error;
  }
}

function deserializeUserAssetsState(serializedState: string) {
  let parsedState: { state: UserAssetsStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from user assets storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let userAssetsData: Map<UniqueId, ParsedSearchAsset> = new Map();
  try {
    if (state.userAssets.length) {
      userAssetsData = new Map(state.userAssets);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssets from user assets storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      userAssets: userAssetsData,
    },
    version,
  };
}

export const userAssetsStore = createRainbowStore<UserAssetsState>(
  (_, get) => ({
    userAssets: new Map(),

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) as ParsedSearchAsset,
    hasUserAsset: (uniqueId: UniqueId) => get().userAssets.has(uniqueId),
  }),
  {
    storageKey: 'userAssets',
    version: 1,
    partialize: state => ({
      userAssets: state.userAssets,
    }),
    serializer: serializeUserAssetsState,
    deserializer: deserializeUserAssetsState,
  }
);
