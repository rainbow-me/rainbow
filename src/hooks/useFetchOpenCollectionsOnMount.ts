import { parseUniqueId } from '@/resources/nfts/utils';
import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { promiseUtils } from '@/utils';
import { isAddress } from '@ethersproject/address';
import { useCallback, useEffect } from 'react';
import { logger } from '@/logger';

export default function useFetchOpenCollectionsOnMount() {
  const address = useAccountAddress();

  const fetchCollections = useCallback(() => {
    logger.debug('[useFetchOpenCollectionsOnMount] fetchCollections called', { address });

    if (!address) {
      logger.debug('[useFetchOpenCollectionsOnMount] No address, returning early');
      return;
    }

    const { openCollections } = useOpenCollectionsStore.getState(address);
    logger.debug('[useFetchOpenCollectionsOnMount] Open collections state:', openCollections);

    const collections = Object.keys(openCollections).filter(collectionId => {
      const { contractAddress } = parseUniqueId(collectionId);
      return isAddress(contractAddress) && openCollections[collectionId];
    });
    logger.debug(`[useFetchOpenCollectionsOnMount] Filtered open collections: ${collections.join(', ')}`);

    const { fetchNftCollection } = useNftsStore.getState(address);
    const promises = collections.map(collectionId => {
      const normalizedCollectionId = collectionId.toLowerCase();
      logger.debug(`[useFetchOpenCollectionsOnMount] Creating promise for collection: ${normalizedCollectionId}`);
      return fetchNftCollection(normalizedCollectionId);
    });

    logger.debug(`[useFetchOpenCollectionsOnMount] Starting PromiseAllWithFails with ${promises.length} promises`);
    promiseUtils.PromiseAllWithFails(promises);
  }, [address]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return null;
}
