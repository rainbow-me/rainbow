import { type StorageValue } from '@storesjs/stores';

import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { logger, RainbowError } from '@/logger';

import { type QueryEnabledUserAssetsState, type UserAssetsState } from './types';

export type UserAssetsStateToPersist = Pick<UserAssetsState, 'chainBalances' | 'hiddenAssets' | 'userAssets'>;

type PersistedQueryState = Pick<QueryEnabledUserAssetsState, 'error' | 'lastFetchedAt' | 'queryCache' | 'queryKey' | 'status'>;

type PersistedUserAssetsState = {
  chainBalances: Array<[ChainId, number]>;
  hiddenAssets: UniqueId[];
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
} & PersistedQueryState;

/**
 * Serializes map and set fields as arrays.
 */
export function serializeUserAssetsState({ state, version }: StorageValue<UserAssetsStateToPersist>): string {
  try {
    return JSON.stringify({
      state: {
        ...state,
        chainBalances: Array.from(state.chainBalances),
        hiddenAssets: Array.from(state.hiddenAssets),
        userAssets: Array.from(state.userAssets),
      },
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to serialize user assets'), { error });
    throw error;
  }
}

/**
 * Restores map and set fields from their persisted arrays.
 */
export function deserializeUserAssetsState(serializedState: unknown): StorageValue<UserAssetsStateToPersist & PersistedQueryState> {
  let parsed: StorageValue<PersistedUserAssetsState>;

  try {
    if (typeof serializedState === 'string') parsed = JSON.parse(serializedState);
    else throw new Error('Expected string serialized state');
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to parse serialized user assets'), { error });
    throw error;
  }

  const { state, version } = parsed;

  return {
    state: {
      ...state,
      chainBalances: new Map(state.chainBalances),
      hiddenAssets: new Set(state.hiddenAssets),
      userAssets: new Map(state.userAssets),
    },
    version,
  };
}
