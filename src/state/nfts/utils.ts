import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { showcaseTokensQueryKey } from '@/hooks/useFetchShowcaseTokens';
import { hiddenTokensQueryKey } from '@/hooks/useFetchHiddenTokens';
import { queryClient } from '@/react-query';
import { Address } from 'viem';
import { useNftsStore } from '@/state/nfts/nfts';
import { STALE_TIME } from '@/state/nfts/createNftsStore';
import { NftsState } from '@/state/nfts/types';
import { parseUniqueId } from '@/resources/nfts/utils';
import { logger } from '@/logger';

export function replaceEthereumWithMainnet(network: string | undefined): string | undefined {
  if (!network) return undefined;

  if (network === 'ethereum') {
    return 'mainnet';
  }
  return network;
}

export function mergeMaps<T>(map1: Map<string, T>, map2: Map<string, T>) {
  return new Map(
    (function* () {
      yield* map1;
      yield* map2;
    })()
  );
}

export function getHiddenAndShowcaseCollectionIds(address: Address | string) {
  const showcaseTokens = queryClient.getQueryData<string[]>(showcaseTokensQueryKey({ address })) ?? [];
  const hiddenTokens = queryClient.getQueryData<string[]>(hiddenTokensQueryKey({ address })) ?? [];

  return {
    showcaseCollectionIds: new Set(
      showcaseTokens.map(uniqueId => {
        const { network, contractAddress } = parseUniqueId(uniqueId);
        return `${network}_${contractAddress}`.toLowerCase();
      })
    ),
    hiddenCollectionIds: new Set(
      hiddenTokens.map(uniqueId => {
        const { network, contractAddress } = parseUniqueId(uniqueId);
        return `${network}_${contractAddress}`.toLowerCase();
      })
    ),
  };
}

const ENABLE_DEEPER_DEBUG_LOGS = false;

export async function pruneStaleAndClosedCollections({
  address,
  set,
}: {
  address: Address | string;
  set: (state: Partial<NftsState>) => void;
}) {
  if (ENABLE_DEEPER_DEBUG_LOGS) {
    logger.debug(`[🧹 pruneStaleAndClosedCollections] Starting prune for address: ${address}`);
  }

  const { nftsByCollection, fetchedCollections } = useNftsStore.getState(address);
  const { openCollections } = useOpenCollectionsStore.getState();

  if (ENABLE_DEEPER_DEBUG_LOGS) {
    logger.debug(`[📊 pruneStaleAndClosedCollections] Current nftsByCollection size: ${nftsByCollection.size}`);
    logger.debug(`[🔓 pruneStaleAndClosedCollections] Open collections: ${Object.keys(openCollections)}`);
  }

  const { showcaseCollectionIds, hiddenCollectionIds } = getHiddenAndShowcaseCollectionIds(address);

  if (ENABLE_DEEPER_DEBUG_LOGS) {
    logger.debug(`[⭐ pruneStaleAndClosedCollections] Showcase collection IDs: ${Array.from(showcaseCollectionIds)}`);
    logger.debug(`[👻 pruneStaleAndClosedCollections] Hidden collection IDs: ${Array.from(hiddenCollectionIds)}`);
  }

  const isHiddenOpen = openCollections['hidden'] ?? false;
  if (ENABLE_DEEPER_DEBUG_LOGS) {
    logger.debug(`[👻 pruneStaleAndClosedCollections] Is hidden collection open: ${isHiddenOpen}`);
  }

  const newNftsByCollection = new Map(nftsByCollection);
  let prunedCount = 0;

  for (const [collectionId, isOpen] of Object.entries(openCollections)) {
    const normalizedCollectionId = collectionId.toLowerCase();
    if (ENABLE_DEEPER_DEBUG_LOGS) {
      logger.debug(`[🔍 pruneStaleAndClosedCollections] Checking collection: ${normalizedCollectionId} isOpen: ${isOpen}`);
    }

    // don't prune if the collection is still open or showcase / hidden (we have to check against all ids for those)
    if (
      isOpen ||
      normalizedCollectionId === 'showcase' ||
      showcaseCollectionIds.has(normalizedCollectionId) || // never prune showcase collections
      (isHiddenOpen && hiddenCollectionIds.has(normalizedCollectionId))
    ) {
      if (ENABLE_DEEPER_DEBUG_LOGS) {
        logger.debug(`[✅ pruneStaleAndClosedCollections] Skipping collection (protected): ${normalizedCollectionId}`);
      }
      continue;
    }

    const collection = nftsByCollection.get(normalizedCollectionId);
    if (!collection) {
      if (ENABLE_DEEPER_DEBUG_LOGS) {
        logger.debug(`[⚠️ pruneStaleAndClosedCollections] Collection not found in store: ${normalizedCollectionId}`);
      }
      continue;
    }

    const now = Date.now();
    const lastFetched = fetchedCollections[normalizedCollectionId];
    const timeSinceFetch = lastFetched ? now - lastFetched : 0;

    if (ENABLE_DEEPER_DEBUG_LOGS) {
      logger.debug(
        `[⏰ pruneStaleAndClosedCollections] Collection: ${normalizedCollectionId} lastFetched: ${lastFetched} timeSinceFetch: ${timeSinceFetch} STALE_TIME: ${STALE_TIME}`
      );
    }

    if (lastFetched && timeSinceFetch < STALE_TIME) {
      if (ENABLE_DEEPER_DEBUG_LOGS) {
        logger.debug(`[⏳ pruneStaleAndClosedCollections] Collection not stale yet, skipping: ${normalizedCollectionId}`);
      }
      continue;
    }

    if (ENABLE_DEEPER_DEBUG_LOGS) {
      logger.debug(`[🗑️ pruneStaleAndClosedCollections] Pruning stale collection: ${normalizedCollectionId}`);
    }
    newNftsByCollection.delete(normalizedCollectionId);
    prunedCount += 1;
  }

  if (prunedCount > 0) {
    logger.debug(
      `[📊 pruneStaleAndClosedCollections] Pruning complete. Pruned collections: ${prunedCount} New size: ${newNftsByCollection.size}`
    );
  }

  set({ nftsByCollection: newNftsByCollection });
}
