import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { getShowcase, showcaseTokensQueryKey } from '@/hooks/useFetchShowcaseTokens';
import { getHidden, hiddenTokensQueryKey } from '@/hooks/useFetchHiddenTokens';
import { queryClient } from '@/react-query';
import { Address } from 'viem';
import { useNftsStore } from '@/state/nfts/nfts';
import { STALE_TIME } from '@/state/nfts/createNftsStore';
import { NftsState } from '@/state/nfts/types';
import { parseUniqueId } from '@/resources/nfts/utils';
import { logger } from '@/logger';
import { isLowerCaseMatch } from '@/utils';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/references';
import { UniqueAsset } from '@/entities';
import { fetchNFTData, NFTData, nftsQueryKey } from '@/resources/nfts';
import { isENSAddressFormat } from '@/helpers/validators';
import { IS_DEV } from '@/env';

export function isDataComplete(tokens: string[]) {
  if (!tokens.length) return true;

  for (const token of tokens) {
    const { network, contractAddress, tokenId } = parseUniqueId(token);
    if (!network || !contractAddress || !tokenId) return false;
  }
  return true;
}

export function matchEnsNameToUniqueId(ensName: string, nfts: UniqueAsset[]): UniqueAsset['uniqueId'] | undefined {
  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, ENS_NFT_CONTRACT_ADDRESS) || !isLowerCaseMatch(nft.name, ensName)) continue;
    return nft.uniqueId;
  }

  return undefined;
}

export function matchContractAndAddress(uniqueId: string, nfts: UniqueAsset[]): string | undefined {
  const { contractAddress, tokenId } = parseUniqueId(uniqueId);

  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, contractAddress)) continue;
    return `${nft.network}_${contractAddress}_${tokenId}`;
  }

  return undefined;
}

export async function migrateTokens(accountAddress: string, tokens: string[]): Promise<string[] | null> {
  const migratedTokens: string[] = [];

  const queryKey = nftsQueryKey({
    address: accountAddress,
  });

  const data = await queryClient.fetchQuery<NFTData>({ queryKey, queryFn: () => fetchNFTData({ queryKey, meta: undefined }) });
  logger.debug(`🔄 [Migration] Has cached query data: ${!!data}`);

  if (!data.nfts.length) return null;

  for (const token of tokens) {
    const isENS = isENSAddressFormat(token);
    if (isENS) {
      logger.debug(`🔄 [Migration] Migrating ENS name: ${token}`);
      const uniqueId = matchEnsNameToUniqueId(token, data.nfts);
      if (!uniqueId) {
        logger.debug(`🔄 [Migration] No match found for ENS name: ${token}`);
        continue;
      }

      logger.debug(`🔄 [Migration] Migrating ENS name to uniqueId: ${uniqueId}`);
      migratedTokens.push(uniqueId.toLowerCase());
    } else {
      logger.debug(`🔄 [Migration] Migrating contractAddress and tokenId: ${token}`);
      const uniqueId = matchContractAndAddress(token, data.nfts);
      if (!uniqueId) {
        logger.debug(`🔄 [Migration] No match found for token: ${token}`);
        continue;
      }

      logger.debug(`🔄 [Migration] Migrating token ${token} to uniqueId: ${uniqueId}`);
      migratedTokens.push(uniqueId.toLowerCase());
    }
  }

  if (!migratedTokens.length) return null;

  return migratedTokens;
}

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

export function getShowcaseAndHiddenTokenIds(address: Address | string, category?: 'showcase' | 'hidden') {
  if (category) {
    const tokens =
      category === 'showcase'
        ? queryClient.getQueryData<string[]>(showcaseTokensQueryKey({ address })) ?? []
        : queryClient.getQueryData<string[]>(hiddenTokensQueryKey({ address })) ?? [];

    return new Set(tokens);
  }

  const showcaseTokens = queryClient.getQueryData<string[]>(showcaseTokensQueryKey({ address })) ?? [];
  const hiddenTokens = queryClient.getQueryData<string[]>(hiddenTokensQueryKey({ address })) ?? [];

  return new Set([...showcaseTokens, ...hiddenTokens]);
}

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
    const tokens = category === 'showcase' ? await getShowcase(address) : await getHidden(address);

    return {
      collectionIds: new Set(
        tokens.map(uniqueId => {
          const { network, contractAddress } = parseUniqueId(uniqueId);
          return `${network}_${contractAddress}`.toLowerCase();
        })
      ),
    };
  }

  const [showcaseTokens, hiddenTokens] = await Promise.all([getShowcase(address), getHidden(address)]);

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

export async function pruneStaleAndClosedCollections({
  address,
  set,
}: {
  address: Address | string;
  set: (state: Partial<NftsState>) => void;
}) {
  const { nftsByCollection, fetchedCollections } = useNftsStore.getState(address);
  const { openCollections } = useOpenCollectionsStore.getState(address);

  const { showcaseCollectionIds, hiddenCollectionIds } = await getHiddenAndShowcaseCollectionIds(address);

  const isHiddenOpen = openCollections['hidden'] ?? false;

  const newNftsByCollection = new Map(nftsByCollection);

  for (const [collectionId, isOpen] of Object.entries(openCollections)) {
    const normalizedCollectionId = collectionId.toLowerCase();

    // don't prune if the collection is still open or showcase / hidden (we have to check against all ids for those)
    if (
      isOpen ||
      normalizedCollectionId === 'showcase' ||
      showcaseCollectionIds.has(normalizedCollectionId) || // never prune showcase collections
      (isHiddenOpen && hiddenCollectionIds.has(normalizedCollectionId))
    ) {
      continue;
    }

    const collection = nftsByCollection.get(normalizedCollectionId);
    if (!collection) {
      continue;
    }

    const now = Date.now();
    const lastFetched = fetchedCollections[normalizedCollectionId];
    const timeSinceFetch = lastFetched ? now - lastFetched : 0;

    if (lastFetched && timeSinceFetch < STALE_TIME) {
      continue;
    }

    newNftsByCollection.delete(normalizedCollectionId);
  }

  set({ nftsByCollection: newNftsByCollection });
}
