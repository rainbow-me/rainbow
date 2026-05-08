import { useQuery } from '@tanstack/react-query';

import { EthereumWalletType } from '@/helpers/walletTypes';
import { getPreference } from '@/model/preferences';
import { queryClient } from '@/react-query';
import { useNftsStore } from '@/state/nfts/nfts';
import { isDataComplete } from '@/state/nfts/utils';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';

type ProfileTokenCategory = 'showcase' | 'hidden';

const STABLE_ARRAY: string[] = [];
const STALE_TIME = time.minutes(10);

export const profileTokensQueryKey = (category: ProfileTokenCategory, address: string) => [`${category}-tokens`, address];
export const showcaseTokensQueryKey = ({ address }: { address: string }) => profileTokensQueryKey('showcase', address);
export const hiddenTokensQueryKey = ({ address }: { address: string }) => profileTokensQueryKey('hidden', address);

export async function loadIds(category: ProfileTokenCategory, address: string): Promise<string[] | undefined> {
  if (category === 'showcase') return (await getPreference('showcase', address))?.showcase?.ids;
  return (await getPreference('hidden', address))?.hidden?.ids;
}

export type { ProfileTokenCategory };

async function getProfileTokens(category: ProfileTokenCategory, address: string, isMigration = false): Promise<string[]> {
  if (!address) return STABLE_ARRAY;

  const ids = await loadIds(category, address);
  if (!ids?.length) return STABLE_ARRAY;

  if (isDataComplete(ids) || isMigration) return ids.map(id => id.toLowerCase());

  const isReadOnlyWallet = getWalletWithAccount(address)?.type === EthereumWalletType.readOnly;
  if (isReadOnlyWallet) return STABLE_ARRAY;

  const data = await useNftsStore
    .getState(address)
    .fetch(
      { collectionId: category, isMigration: true },
      { force: true, updateQueryKey: false, cacheTime: time.infinity, staleTime: time.infinity }
    );
  if (!data) return [...ids];

  useNftsStore.setState(state => ({
    ...state,
    nftsByCollection: new Map([...state.nftsByCollection, ...data.nftsByCollection]),
    fetchedCollections: { ...state.fetchedCollections, [category]: Date.now() },
  }));

  return Array.from(data.nftsByCollection.values()).flatMap(collection => Array.from(collection.keys()));
}

export const getShowcase = (address: string, isMigration = false) => getProfileTokens('showcase', address, isMigration);
export const getHidden = (address: string, isMigration = false) => getProfileTokens('hidden', address, isMigration);

const fetchProfileTokens = (category: ProfileTokenCategory, { address }: { address: string }) =>
  queryClient.fetchQuery({
    queryKey: profileTokensQueryKey(category, address),
    queryFn: () => getProfileTokens(category, address),
    staleTime: STALE_TIME,
  });

export const fetchShowcaseTokens = (args: { address: string }) => fetchProfileTokens('showcase', args);
export const fetchHiddenTokens = (args: { address: string }) => fetchProfileTokens('hidden', args);

const useFetchProfileTokens = (category: ProfileTokenCategory, { address }: { address: string }) =>
  useQuery<string[]>(profileTokensQueryKey(category, address), () => getProfileTokens(category, address), {
    enabled: Boolean(address),
    cacheTime: time.infinity,
    staleTime: STALE_TIME,
  });

export const useFetchShowcaseTokens = (args: { address: string }) => useFetchProfileTokens('showcase', args);
export const useFetchHiddenTokens = (args: { address: string }) => useFetchProfileTokens('hidden', args);
