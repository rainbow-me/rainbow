import { type Address } from 'viem';
import { beforeEach, expect, it, vi } from 'vitest';

import { useCollectionNftsStore } from '@/features/nfts/data/collectionNftsStore';
import { NftTokenType, type GetNftsByCollectionQuery } from '@/graphql/__generated__/arc';

import { buildNftPreferences, buildNftRows } from './buildNftRows';

const api = vi.hoisted(() => ({ collection: vi.fn() }));
vi.mock('@/graphql', () => ({
  arcClient: { getNftsByCollection: api.collection },
}));
vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: { getState: () => ({ getChainsIdByName: () => ({ mainnet: 1 }) }) },
}));
vi.mock('@/utils/handleNFTImages', () => ({ handleNFTImages: () => ({ highResUrl: undefined, lowResUrl: undefined }) }));

let accountIndex = 10;
function nextAddress(): Address {
  accountIndex += 1;
  return `0x${accountIndex.toString(16).padStart(40, '0')}`;
}
const collectionId = 'mainnet_0x0000000000000000000000000000000000000001';
const first = `${collectionId}_42`;
const second = `${collectionId}_5000`;
const summary = { id: collectionId, name: 'Collection', totalCount: '2', imageUrl: '' };
type NftFixture = Pick<
  GetNftsByCollectionQuery['nftsByCollection'][number],
  'uniqueId' | 'name' | 'standard' | 'type' | 'isSendable' | 'images' | 'traits'
>;
function nft(uniqueId: string): NftFixture {
  return { uniqueId, name: uniqueId, standard: NftTokenType.Erc721, type: 'nft', isSendable: true, images: {}, traits: [] };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.collection.mockResolvedValue({ nftsByCollection: [nft(first), nft(second)] });
});

it('excludes saved NFTs from ordinary rows using their IDs, not numeric token indices', async () => {
  const nfts = await useCollectionNftsStore.getState().load({ walletAddress: nextAddress(), collectionId });
  if (!nfts) throw new Error('Collection fixture failed to load');

  const rows = buildNftRows({
    collections: new Map([[collectionId, summary]]),
    collectionNfts: new Map([[collectionId, nfts]]),
    metadata: new Map(),
    preferences: buildNftPreferences([first], []),
    openCollections: { [collectionId]: true },
    loading: false,
    hasMore: false,
    readOnly: false,
  });

  expect(rows).toContainEqual(expect.objectContaining({ type: 'FAMILY_HEADER', uid: collectionId, total: 1 }));
  expect(rows).toContainEqual(expect.objectContaining({ type: 'NFT', uid: second, asset: nfts.get(second) }));
});
