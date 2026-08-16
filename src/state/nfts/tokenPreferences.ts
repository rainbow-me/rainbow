import { time } from '@/framework/core/utils/time';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { updateWebHidden, updateWebShowcase } from '@/helpers/webData';
import { getPreference } from '@/model/preferences';
import { queryClient } from '@/react-query';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';

import { useOpenCollectionsStore } from './openCollectionsStore';
import { isDataComplete, migrateTokens } from './utils';

const EMPTY_TOKEN_IDS: string[] = [];
const TOKEN_PREFERENCES_STALE_TIME = time.minutes(10);

export function hiddenTokensQueryKey({ address }: { address: string }): ['hidden-tokens', string] {
  return ['hidden-tokens', address];
}

export function showcaseTokensQueryKey({ address }: { address: string }): ['showcase-tokens', string] {
  return ['showcase-tokens', address];
}

async function migratePreferenceTokenIds(address: string, category: 'hidden' | 'showcase', tokenIds: string[]): Promise<string[]> {
  const isReadOnlyWallet = getWalletWithAccount(address)?.type === EthereumWalletType.readOnly;
  if (isReadOnlyWallet) return EMPTY_TOKEN_IDS;

  const migratedTokenIds = await migrateTokens(address, tokenIds);
  if (!migratedTokenIds) return tokenIds;

  if (category === 'hidden') {
    await updateWebHidden(address, migratedTokenIds);
  } else {
    await updateWebShowcase(address, migratedTokenIds);
    useOpenCollectionsStore.getState(address).setCollectionOpen('showcase', true);
  }

  return migratedTokenIds;
}

export async function getHiddenTokenIds(address: string): Promise<string[]> {
  if (!address) return EMPTY_TOKEN_IDS;

  const preference = await getPreference('hidden', address);
  const tokenIds = preference?.hidden?.ids;
  if (!tokenIds?.length) return EMPTY_TOKEN_IDS;
  if (!isDataComplete(tokenIds)) return migratePreferenceTokenIds(address, 'hidden', tokenIds);
  return tokenIds.map(tokenId => tokenId.toLowerCase());
}

export async function getShowcaseTokenIds(address: string): Promise<string[]> {
  if (!address) return EMPTY_TOKEN_IDS;

  const preference = await getPreference('showcase', address);
  const tokenIds = preference?.showcase?.ids;
  if (!tokenIds?.length) return EMPTY_TOKEN_IDS;
  if (!isDataComplete(tokenIds)) return migratePreferenceTokenIds(address, 'showcase', tokenIds);
  return tokenIds.map(tokenId => tokenId.toLowerCase());
}

export function fetchHiddenTokens({ address }: { address: string }): Promise<string[]> {
  return queryClient.fetchQuery({
    queryKey: hiddenTokensQueryKey({ address }),
    queryFn: () => getHiddenTokenIds(address),
    cacheTime: time.infinity,
    staleTime: TOKEN_PREFERENCES_STALE_TIME,
  });
}

export function fetchShowcaseTokens({ address }: { address: string }): Promise<string[]> {
  return queryClient.fetchQuery({
    queryKey: showcaseTokensQueryKey({ address }),
    queryFn: () => getShowcaseTokenIds(address),
  });
}

export const tokenPreferencesQueryOptions = {
  cacheTime: time.infinity,
  staleTime: TOKEN_PREFERENCES_STALE_TIME,
};
