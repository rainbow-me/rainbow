import { type Address } from 'viem';

import { parseUniqueId } from '@/resources/nfts/utils';

import { NFTS_STALE_TIME } from './constants';
import { useOpenCollectionsStore } from './openCollectionsStore';
import { fetchHiddenTokens, fetchShowcaseTokens } from './tokenPreferences';
import { type NftsState } from './types';

export async function getHiddenAndShowcaseCollectionIds(
  address: Address | string,
  category: 'showcase' | 'hidden'
): Promise<{ collectionIds: Set<string> }>;
export async function getHiddenAndShowcaseCollectionIds(address: Address | string): Promise<{
  showcaseCollectionIds: Set<string>;
  hiddenCollectionIds: Set<string>;
}>;
export async function getHiddenAndShowcaseCollectionIds(
  address: Address | string,
  category?: 'showcase' | 'hidden'
): Promise<{ collectionIds: Set<string> } | { showcaseCollectionIds: Set<string>; hiddenCollectionIds: Set<string> }> {
  if (category) {
    const tokenIds = category === 'showcase' ? await fetchShowcaseTokens({ address }) : await fetchHiddenTokens({ address });
    return { collectionIds: getCollectionIds(tokenIds) };
  }

  const [showcaseTokenIds, hiddenTokenIds] = await Promise.all([fetchShowcaseTokens({ address }), fetchHiddenTokens({ address })]);

  return {
    showcaseCollectionIds: getCollectionIds(showcaseTokenIds),
    hiddenCollectionIds: getCollectionIds(hiddenTokenIds),
  };
}

export async function pruneStaleAndClosedCollections({
  address,
  state,
  set,
}: {
  address: Address | string;
  state: Pick<NftsState, 'fetchedCollections' | 'nftsByCollection'>;
  set: (state: Partial<NftsState>) => void;
}): Promise<void> {
  const { nftsByCollection, fetchedCollections } = state;
  const { openCollections } = useOpenCollectionsStore.getState(address);
  const { showcaseCollectionIds, hiddenCollectionIds } = await getHiddenAndShowcaseCollectionIds(address);
  const isHiddenOpen = openCollections.hidden ?? false;
  const newNftsByCollection = new Map(nftsByCollection);

  for (const [collectionId, isOpen] of Object.entries(openCollections)) {
    const normalizedCollectionId = collectionId.toLowerCase();
    if (
      isOpen ||
      normalizedCollectionId === 'showcase' ||
      showcaseCollectionIds.has(normalizedCollectionId) ||
      (isHiddenOpen && hiddenCollectionIds.has(normalizedCollectionId))
    ) {
      continue;
    }

    if (!nftsByCollection.has(normalizedCollectionId)) continue;

    const lastFetched = fetchedCollections[normalizedCollectionId];
    if (lastFetched && Date.now() - lastFetched < NFTS_STALE_TIME) continue;
    newNftsByCollection.delete(normalizedCollectionId);
  }

  set({ nftsByCollection: newNftsByCollection });
}

function getCollectionIds(tokenIds: string[]): Set<string> {
  return new Set(
    tokenIds.map(uniqueId => {
      const { network, contractAddress } = parseUniqueId(uniqueId);
      return `${network}_${contractAddress}`.toLowerCase();
    })
  );
}
