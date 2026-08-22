import type { UniqueAsset } from '@/entities/uniqueAssets';

import { createNftsStore } from './createNftsStore';
import { type NftsQueryData, type QueryEnabledNftsState } from './types';

jest.mock('@/graphql', () => ({ arcClient: {} }));
jest.mock('@/helpers/webData', () => ({
  updateWebHidden: jest.fn(),
  updateWebShowcase: jest.fn(),
}));
jest.mock('@/hooks/useFetchHiddenTokens', () => ({
  fetchHiddenTokens: jest.fn(),
  getHidden: jest.fn(),
}));
jest.mock('@/hooks/useFetchShowcaseTokens', () => ({
  fetchShowcaseTokens: jest.fn(),
  getShowcase: jest.fn(),
}));
jest.mock('@/state/wallets/walletsStore', () => ({
  getIsReadOnlyWallet: jest.fn(() => false),
}));
jest.mock('@/state/nfts/utils', () => ({
  getHiddenAndShowcaseCollectionIds: jest.fn(() =>
    Promise.resolve({ collectionIds: new Set(), hiddenCollectionIds: new Set(), showcaseCollectionIds: new Set() })
  ),
  mergeMaps: jest.fn(),
  migrateTokens: jest.fn(),
  pruneStaleAndClosedCollections: jest.fn(() => Promise.resolve()),
  replaceEthereumWithMainnet: jest.fn((mockNetwork: string) => mockNetwork),
}));

const COLLECTION_ID = 'mainnet_0x1234';

describe('fetchNftCollection', () => {
  it('retries a nonempty partial response until it reaches the expected count', async () => {
    const store = createNftsStore('0xwallet');
    const mockFetch = jest
      .fn<ReturnType<QueryEnabledNftsState['fetch']>, Parameters<QueryEnabledNftsState['fetch']>>()
      .mockResolvedValueOnce(collectionData('nft-1'))
      .mockResolvedValueOnce(collectionData('nft-1', 'nft-2'));

    store.setState({
      fetch: mockFetch,
      getNftsByCollection: collectionId => store.getState().nftsByCollection.get(collectionId) ?? null,
    });

    await store.getState().fetchNftCollection(COLLECTION_ID, { expectedCount: 2 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, { collectionId: COLLECTION_ID }, expect.objectContaining({ force: true }));
    expect(store.getState().nftsByCollection.get(COLLECTION_ID)?.size).toBe(2);
  });

  it('allows a forced refresh to replace a collection with fewer NFTs', async () => {
    const store = createNftsStore('0xother-wallet');
    const mockFetch = jest
      .fn<ReturnType<QueryEnabledNftsState['fetch']>, Parameters<QueryEnabledNftsState['fetch']>>()
      .mockResolvedValueOnce(collectionData('nft-1'));

    store.setState({
      fetch: mockFetch,
      getNftsByCollection: collectionId => store.getState().nftsByCollection.get(collectionId) ?? null,
      nftsByCollection: collectionData('nft-1', 'nft-2').nftsByCollection,
    });

    await store.getState().fetchNftCollection(COLLECTION_ID, { force: true });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(store.getState().nftsByCollection.get(COLLECTION_ID)?.size).toBe(1);
  });
});

function collectionData(...ids: string[]): NftsQueryData {
  return {
    collections: new Map(),
    nftsByCollection: new Map([[COLLECTION_ID, new Map(ids.map(id => [id, { uniqueId: id } as UniqueAsset]))]]),
    pagination: null,
  };
}
