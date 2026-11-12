import { type StorageValue } from '@storesjs/stores';

import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { logger, RainbowError } from '@/logger';

import { type QueryEnabledUserAssetsState, type UserAssetsState } from './types';
import { getChainBalances, updateHiddenAssetsBalance } from './utils';

/** Persisted holdings and preferences; chain balances are rebuilt on hydration. */
export type UserAssetsStateToPersist = Pick<Partial<UserAssetsState>, 'hiddenAssets' | 'userAssets'>;

type PersistedUserAssetsState = Pick<
  Partial<QueryEnabledUserAssetsState>,
  'error' | 'lastFetchedAt' | 'queryCache' | 'queryKey' | 'status'
> & {
  hiddenAssets?: UniqueId[];
  userAssets?: Array<[UniqueId, ParsedSearchAsset]>;
};

/** Serializes canonical holdings while preserving the query store's fetch metadata. */
export function serializeUserAssetsState({ state, version }: StorageValue<UserAssetsStateToPersist>): string {
  try {
    return JSON.stringify({
      state: {
        ...state,
        hiddenAssets: Array.from(state.hiddenAssets ?? []),
        userAssets: Array.from(state.userAssets ?? []),
      },
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to serialize user assets'), { error });
    throw error;
  }
}

/**
 * Restores complete holdings, preferences, and fetch metadata for the requested account.
 */
export function deserializeUserAssetsState(
  serializedState: unknown,
  address: UserAssetsState['address']
): StorageValue<Partial<QueryEnabledUserAssetsState>> {
  let parsed: StorageValue<PersistedUserAssetsState>;
  try {
    if (typeof serializedState !== 'string') throw new Error('Expected string serialized state');
    parsed = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to parse serialized user assets'), { error });
    throw error;
  }

  const { state, version } = parsed;
  let userAssets = new Map<UniqueId, ParsedSearchAsset>();
  let hiddenAssets = new Set<UniqueId>();
  try {
    userAssets = new Map(state.userAssets);
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to restore user assets'), { error });
  }
  try {
    hiddenAssets = new Set(state.hiddenAssets);
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to restore hidden assets'), { error });
  }

  updateHiddenAssetsBalance({ address, userAssets, hiddenAssets });

  return {
    state: {
      hiddenAssets,
      userAssets,
      error: state.error ?? null,
      lastFetchedAt: state.lastFetchedAt ?? null,
      queryCache: state.queryCache ?? {},
      queryKey: state.queryKey ?? '',
      status: state.status ?? 'idle',
      chainBalances: getChainBalances(userAssets),
    },
    version,
  };
}
