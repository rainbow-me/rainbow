import { RainbowError, logger } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { UserAssetsState } from './types';
import { makeMutable, SharedValue } from 'react-native-reanimated';

export type UserAssetsStateToPersist = Pick<
  Partial<UserAssetsState>,
  'chainBalances' | 'filter' | 'hiddenAssets' | 'idsByChain' | 'legacyUserAssets' | 'userAssets' | 'pinnedAssets'
>;

type PersistedUserAssetsState = Pick<UserAssetsStateToPersist, 'filter' | 'legacyUserAssets'> & {
  chainBalances: Array<[ChainId, number]>; // Map
  hiddenAssets: UniqueId[]; // Set
  idsByChain: Array<[UserAssetFilter, UniqueId[]]>; // Map
  userAssets: Array<[UniqueId, ParsedSearchAsset]>; // Map
  pinnedAssets: UniqueId[]; // Set
  hiddenAssetsSharedvalue: SharedValue<Record<UniqueId, boolean>>; // Map
  pinnedAssetsSharedvalue: SharedValue<Record<UniqueId, boolean>>; // Map
};

export function serializeUserAssetsState(state: UserAssetsStateToPersist, version?: number) {
  try {
    const transformedStateToPersist: Omit<PersistedUserAssetsState, 'hiddenAssetsSharedvalue' | 'pinnedAssetsSharedvalue'> = {
      ...state,
      chainBalances: state.chainBalances ? Array.from(state.chainBalances.entries()) : [],
      idsByChain: state.idsByChain ? Array.from(state.idsByChain.entries()) : [],
      userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
      hiddenAssets: state.hiddenAssets ? Array.from(state.hiddenAssets.values()) : [],
      pinnedAssets: state.pinnedAssets ? Array.from(state.pinnedAssets.values()) : [],
    };
    return JSON.stringify({ state: transformedStateToPersist, version });
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to serialize state for user assets storage`), { error });
    throw error;
  }
}

export function deserializeUserAssetsState(serializedState: string) {
  let parsedState: { state: PersistedUserAssetsState; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to parse serialized state from user assets storage`), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let chainBalances = new Map<ChainId, number>();
  try {
    if (state.chainBalances) {
      chainBalances = new Map(state.chainBalances);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert chainBalances from user assets storage`), { error });
  }

  let idsByChain = new Map<UserAssetFilter, UniqueId[]>();
  try {
    if (state.idsByChain) {
      idsByChain = new Map(state.idsByChain);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert idsByChain from user assets storage`), { error });
  }

  let userAssetsData: Map<UniqueId, ParsedSearchAsset> = new Map();
  try {
    if (state.userAssets.length) {
      userAssetsData = new Map(state.userAssets);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert userAssets from user assets storage`), { error });
  }

  let hiddenAssets = new Set<UniqueId>();
  try {
    if (state.hiddenAssets) {
      hiddenAssets = new Set(state.hiddenAssets);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert hiddenAssets from user assets storage`), { error });
  }

  let pinnedAssets = new Set<UniqueId>();
  try {
    if (state.pinnedAssets) {
      pinnedAssets = new Set(state.pinnedAssets);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert pinnedAssets from user assets storage`), { error });
  }

  const hiddenAssetsSharedvalue = makeMutable(Object.fromEntries(hiddenAssets.values().map(id => [id, true])));
  const pinnedAssetsSharedvalue = makeMutable(Object.fromEntries(pinnedAssets.values().map(id => [id, true])));

  return {
    state: {
      ...state,
      chainBalances,
      hiddenAssets,
      idsByChain,
      userAssets: userAssetsData,
      pinnedAssets,
      hiddenAssetsSharedvalue,
      pinnedAssetsSharedvalue,
    },
    version,
  };
}
