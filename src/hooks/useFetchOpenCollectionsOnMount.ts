import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { promiseUtils } from '@/utils';
import { isAddress } from '@ethersproject/address';
import { useCallback, useEffect } from 'react';

export default function useFetchOpenCollectionsOnMount() {
  const address = useAccountAddress();

  const fetchCollections = useCallback(() => {
    console.log('[useFetchOpenCollectionsOnMount] fetchCollections called', { address });

    if (!address) {
      console.log('[useFetchOpenCollectionsOnMount] No address, returning early');
      return;
    }

    const { openCollections } = useOpenCollectionsStore.getState();
    console.log('[useFetchOpenCollectionsOnMount] Open collections state:', openCollections);

    const collections = Object.keys(openCollections).filter(collectionId => openCollections[collectionId] && isAddress(collectionId));
    console.log('[useFetchOpenCollectionsOnMount] Filtered open collections:', collections);

    const { fetchNftCollection } = useNftsStore.getState(address);
    const promises = collections.map(collectionId => {
      console.log('[useFetchOpenCollectionsOnMount] Creating promise for collection:', collectionId);
      return fetchNftCollection(collectionId, collectionId.toLowerCase() === 'showcase');
    });

    console.log('[useFetchOpenCollectionsOnMount] Starting PromiseAllWithFails with', promises.length, 'promises');
    promiseUtils.PromiseAllWithFails(promises);
  }, [address]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return null;
}
