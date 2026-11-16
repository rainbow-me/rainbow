import { createQueryStore, createVirtualStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type UniqueAsset } from '@/entities/uniqueAssets';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { arcClient } from '@/graphql';
import { parseUniqueAsset } from '@/resources/nfts/utils';
import { createOpenCollectionsStore } from '@/state/nfts/createOpenCollectionsStore';
import { replaceEthereumWithMainnet } from '@/state/nfts/utils';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { parseUniqueId } from '../core/uniqueId';
import { useCollectionNftsStore } from './collectionNftsStore';
import { useHiddenNftsStore } from './hiddenNftsStore';
import { useShowcaseStore } from './showcaseStore';

// ============ Types ========================================================== //

type MetadataParams = { walletAddress: Address; uniqueIds: string[] };
type NftMetadataState = { nfts: Map<string, UniqueAsset> };

// ============ Constants ====================================================== //

const EMPTY_IDS: string[] = [];

// ============ Saved NFT Metadata ============================================= //

export const useNftMetadataStore = createVirtualStore($ => {
  const address = $(useWalletsStore, s => s.accountAddress);
  const openCollectionsStore = createOpenCollectionsStore(address);

  const store = createQueryStore<UniqueAsset[], MetadataParams, NftMetadataState>(
    {
      fetcher: (params, abortController): Promise<UniqueAsset[]> => fetchNftMetadata(params, store.getState().nfts, abortController),
      params: {
        walletAddress: address,
        uniqueIds: $ => {
          const showcaseOpen = $(openCollectionsStore, s => s.isCollectionOpen('showcase'));
          const hiddenOpen = $(openCollectionsStore, s => s.isCollectionOpen('hidden'));
          const showcase = $(useShowcaseStore, s => s.getData({ address }) ?? EMPTY_IDS);
          const hidden = $(useHiddenNftsStore, s => s.getData({ address }) ?? EMPTY_IDS);
          if (!showcaseOpen) return hiddenOpen ? hidden : EMPTY_IDS;
          return hiddenOpen ? [...showcase, ...hidden] : showcase;
        },
      },
      setData: ({ data, set }) => {
        if (!data.length) return;
        set(state => {
          const nfts = new Map(state.nfts);
          for (const asset of data) nfts.set(asset.uniqueId.toLowerCase(), asset);
          return { nfts };
        });
      },
      disableCache: true,
      keepPreviousData: true,
      staleTime: Infinity,
    },
    () => ({ nfts: new Map() }),
    { storageKey: `nftMetadata_${address}`, partialize: state => ({ nfts: state.nfts }) }
  );

  return store;
});

// ============ Fetching ======================================================== //

/**
 * Reuses fetched collection assets and requests only saved NFTs missing from both caches.
 */
async function fetchNftMetadata(
  { walletAddress, uniqueIds }: MetadataParams,
  cached: ReadonlyMap<string, UniqueAsset>,
  abortController: AbortController | null
): Promise<UniqueAsset[]> {
  const collections = useCollectionNftsStore.getState();
  const tokens: Record<string, { contractAddress: string; tokenId: string }[]> = {};
  const nfts: UniqueAsset[] = [];
  let missing = false;

  for (const uniqueId of uniqueIds) {
    if (cached.has(uniqueId)) continue;

    const { network, contractAddress, tokenId } = parseUniqueId(uniqueId);
    const networkName = replaceEthereumWithMainnet(network);
    if (!networkName || !contractAddress || !tokenId) continue;

    const asset = collections.get({ walletAddress, collectionId: `${network}_${contractAddress}` })?.get(uniqueId);
    if (asset) {
      nfts.push(asset);
      continue;
    }

    (tokens[networkName] ??= []).push({ contractAddress, tokenId });
    missing = true;
  }

  if (!missing) return nfts;

  const data = await arcClient.getNftsMetadata({ walletAddress, tokens }, { abortController });
  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  for (const nft of data.getNftsMetadata ?? []) nfts.push(parseUniqueAsset(nft, chainIds));
  return nfts;
}
