import { createQueryStore, createVirtualStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type UniqueAsset } from '@/entities/uniqueAssets';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { arcClient } from '@/graphql';
import { parseUniqueAsset } from '@/resources/nfts/utils';
import { useNftsStore } from '@/state/nfts/nfts';
import { replaceEthereumWithMainnet } from '@/state/nfts/utils';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { collectionIdFromUniqueId, parseUniqueId } from '../core/uniqueId';
import { useHiddenNftsStore } from './hiddenNftsStore';
import { useShowcaseStore } from './showcaseStore';

// ============ Types ========================================================== //

type MetadataParams = { walletAddress: Address; uniqueIds: string[] };
type NftMetadataState = { nfts: Map<string, UniqueAsset> };

// ============ Constants ====================================================== //

const EMPTY_IDS: string[] = [];

// ============ Saved NFT Metadata ============================================= //

/** Resolves saved IDs for open Showcase and Hidden sections, independently of ownership. */
export const useNftMetadataStore = createVirtualStore($ => {
  const address = $(useWalletsStore, s => s.accountAddress);

  const store = createQueryStore<UniqueAsset[], MetadataParams, NftMetadataState>(
    {
      fetcher: (params, abortController): Promise<UniqueAsset[]> => fetchNftMetadata(params, store.getState().nfts, abortController),
      params: {
        walletAddress: address,
        uniqueIds: $ => {
          const showcaseOpen = $(useNftsStore, s => s.openCollections.has('showcase'));
          const hiddenOpen = $(useNftsStore, s => s.openCollections.has('hidden'));
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
          for (const asset of data) nfts.set(asset.uniqueId, asset);
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
  if (!uniqueIds.length) return [];

  const account = useNftsStore.getState();
  const owned = account.address === walletAddress ? account.collectionNfts : undefined;
  const nfts: UniqueAsset[] = [];
  let missing: Record<string, { contractAddress: string; tokenId: string }[]> | undefined;

  for (const uniqueId of uniqueIds) {
    if (cached.has(uniqueId)) continue;

    const asset = owned?.get(collectionIdFromUniqueId(uniqueId))?.get(uniqueId);
    if (asset) {
      nfts.push(asset);
      continue;
    }

    const { network, contractAddress, tokenId } = parseUniqueId(uniqueId);
    const networkName = replaceEthereumWithMainnet(network);
    if (!networkName || !contractAddress || !tokenId) continue;

    missing ??= {};
    (missing[networkName] ??= []).push({ contractAddress, tokenId });
  }

  if (!missing) return nfts;

  const data = await arcClient.getNftsMetadata({ walletAddress, tokens: missing }, { abortController });
  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  for (const nft of data.getNftsMetadata ?? []) nfts.push(parseUniqueAsset(nft, chainIds));
  return nfts;
}
