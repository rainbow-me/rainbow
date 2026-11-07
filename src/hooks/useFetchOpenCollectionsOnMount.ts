import { useEffect } from 'react';

import { isAddress } from 'viem';

import { parseUniqueId } from '@/features/nfts/core/uniqueId';
import { useHiddenNftsStore } from '@/features/nfts/data/hiddenNftsStore';
import { useShowcaseStore } from '@/features/nfts/data/showcaseStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import promiseUtils from '@/utils/promise';

/** Warms the mounted account's open NFT collections during idle time. */
export default function useFetchOpenCollectionsOnMount(): void {
  const fetchNftCollection = useNftsStore(state => state.fetchNftCollection);
  const collections = useNftsStore(state => state.collections);
  const openCollections = useOpenCollectionsStore(state => state.openCollections);
  const showcase = useShowcaseStore(state => state.getData());
  const hidden = useHiddenNftsStore(state => state.getData());

  useEffect(() => {
    const idle = requestIdleCallback(() => {
      const requests: Promise<void>[] = [];
      for (const [id, isOpen] of Object.entries(openCollections)) {
        if (!isOpen) continue;
        const category = id === 'showcase' || id === 'hidden';
        if (category || (collections.has(id) && isAddress(parseUniqueId(id).contractAddress))) {
          requests.push(fetchNftCollection(id));
        }
      }
      void promiseUtils.PromiseAllWithFails(requests);
    });
    return () => cancelIdleCallback(idle);
  }, [fetchNftCollection, collections, openCollections, showcase, hidden]);
}
