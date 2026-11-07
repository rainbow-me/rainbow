import { type Store } from '@storesjs/stores';
import { type Address } from 'viem';

import { parseUniqueId } from '@/features/nfts/core/uniqueId';
import { fetchHiddenTokens } from '@/features/nfts/data/hiddenNftsStore';
import { fetchShowcaseTokens } from '@/features/nfts/data/showcaseStore';

import { NFTS_STALE_TIME } from './constants';
import { useOpenCollectionsStore } from './openCollectionsStore';
import { type NftsState } from './types';

/** Evicts stale closed collection contents while retaining open and preference collections. */
export async function pruneStaleAndClosedCollections({
  address,
  set,
}: {
  address: Address | string;
  set: Store<NftsState>['setState'];
}): Promise<void> {
  const [showcase, hidden] = await Promise.all([fetchShowcaseTokens({ address }), fetchHiddenTokens({ address })]);
  const { openCollections } = useOpenCollectionsStore.getState(address);
  const protectedCollections = new Set<string>();
  for (const uniqueId of [...(showcase ?? []), ...(openCollections.hidden ? (hidden ?? []) : [])]) {
    const { network, contractAddress } = parseUniqueId(uniqueId);
    protectedCollections.add(`${network}_${contractAddress}`.toLowerCase());
  }
  const now = Date.now();

  set(state => {
    let collections = state.collections;
    let nfts = state.nfts;
    const retain = (id: string): boolean => {
      const fetchedAt = state.collections.get(id)?.nfts?.fetchedAt;
      return !!openCollections[id] || protectedCollections.has(id) || (fetchedAt !== undefined && now - fetchedAt < NFTS_STALE_TIME);
    };

    for (const [id, collection] of state.collections) {
      if (!collection.nfts || retain(id)) continue;
      if (collections === state.collections) collections = new Map(collections);
      collections.set(id, { ...collection, nfts: undefined });
    }
    for (const [id] of state.nfts) {
      const { network, contractAddress } = parseUniqueId(id);
      if (retain(`${network}_${contractAddress}`.toLowerCase())) continue;
      if (nfts === state.nfts) nfts = new Map(nfts);
      nfts.delete(id);
    }
    return collections === state.collections && nfts === state.nfts ? state : { collections, nfts };
  });
}
