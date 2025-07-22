import { parseUniqueId } from '@/resources/nfts/utils';
import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { promiseUtils } from '@/utils';
import { isAddress } from '@ethersproject/address';
import { useCallback, useEffect } from 'react';

function shouldFetchCollections(collectionId: string, openCollections: Record<string, boolean>) {
  const normalizedCollectionId = collectionId.toLowerCase();
  if (normalizedCollectionId === 'showcase' || normalizedCollectionId === 'hidden') {
    return true;
  }
  const { contractAddress } = parseUniqueId(collectionId);
  return isAddress(contractAddress) && openCollections[collectionId];
}

export default function useFetchOpenCollectionsOnMount() {
  const address = useAccountAddress();

  const fetchCollections = useCallback(() => {
    if (!address) {
      return;
    }

    const { openCollections } = useOpenCollectionsStore.getState(address);

    const collections = Object.keys(openCollections).filter(collectionId => shouldFetchCollections(collectionId, openCollections));

    const { fetchNftCollection } = useNftsStore.getState(address);
    const promises = collections.map(collectionId => {
      const normalizedCollectionId = collectionId.toLowerCase();
      return fetchNftCollection(normalizedCollectionId);
    });

    promiseUtils.PromiseAllWithFails(promises);
  }, [address]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return null;
}
