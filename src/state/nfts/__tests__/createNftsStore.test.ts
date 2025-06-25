// Mock React Native modules before importing anything that uses them
jest.mock('react-native', () => ({
  NativeModules: {
    RNTestModule: {},
    Aes: {
      randomKey: jest.fn(),
      pbkdf2: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 }),
  },
  PixelRatio: {
    get: () => 2,
  },
}));

jest.mock('react-native/Libraries/Image/AssetUtils', () => ({
  pickScale: jest.fn(() => 2),
}));

// Mock aesEncryption directly
jest.mock('@/handlers/aesEncryption', () => ({
  default: jest.fn(),
}));

// Mock model modules
jest.mock('@/model/preferences', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@/model/keychain', () => ({
  __esModule: true,
  default: {},
}));

// Mock console methods used in the store
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.warn = jest.fn();

// Mock dependencies
jest.mock('@/state/wallets/walletsStore', () => ({
  getAccountAddress: jest.fn(() => '0x123'),
  useAccountAddress: jest.fn(() => '0x123'),
}));
jest.mock('@/graphql');
jest.mock('@/hooks/useFetchShowcaseTokens');
jest.mock('@/hooks/useFetchHiddenTokens');
jest.mock('@/logger');
jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  useBackendNetworksStore: {
    getState: () => ({
      getChainsIdByName: jest.fn().mockReturnValue({}),
    }),
  },
}));

// Import after mocks
import { createNftsStore, PAGINATION_STALE_TIME, PAGE_SIZE } from '../createNftsStore';
import { arcClient } from '@/graphql';
import { Collection } from '../types';
import { getShowcase } from '@/hooks/useFetchShowcaseTokens';
import { getHidden } from '@/hooks/useFetchHiddenTokens';
import { UniqueAsset } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { NftTokenType } from '@/graphql/__generated__/arc';
import { Address } from 'viem';
import { parseUniqueId } from '@/resources/nfts/utils';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

const TEST_ADDRESS = '0x123';
const MOCK_PAGE_1_KEY = 'page-1-key';
const MOCK_PAGE_2_KEY = 'page-2-key';

const createMockCollection = (id: string, name: string): Collection => ({
  id,
  name,
  imageUrl: `https://example.com/${id}.png`,
  totalCount: '5',
});

const createMockUniqueAsset = (uniqueId: UniqueAsset['uniqueId'], name: string): UniqueAsset => {
  const { network, contractAddress, tokenId } = parseUniqueId(uniqueId);
  return {
    uniqueId,
    name,
    description: '',
    contractAddress: contractAddress as Address,
    tokenId,
    network: network as any,
    chainId: ChainId.mainnet,
    standard: NftTokenType.Erc721,
    isSendable: true,
    images: {
      highResUrl: `https://example.com/${uniqueId}.png`,
      lowResUrl: `https://example.com/${uniqueId}_low.png`,
    },
    type: 'nft' as any,
    collectionName: name,
    traits: [],
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  useOpenCollectionsStore.setState({
    openCollections: {
      showcase: true,
    },
  });

  // Default mocks for getShowcase and getHidden
  (getShowcase as jest.Mock).mockResolvedValue([]);
  (getHidden as jest.Mock).mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

test('should fetch the first page of NFT collections', async () => {
  const store = createNftsStore(TEST_ADDRESS);
  const mockData = {
    nftCollections: {
      data: [createMockCollection('collection1', 'Collection 1'), createMockCollection('collection2', 'Collection 2')],
      nextPageKey: MOCK_PAGE_1_KEY,
      totalCollections: 5,
    },
  };

  (arcClient.getNftCollections as jest.Mock).mockResolvedValueOnce(mockData);

  await store.getState().fetch();

  const state = store.getState();
  expect(state.collections.size).toBe(2);
  expect(state.collections.has('collection1')).toBe(true);
  expect(state.collections.has('collection2')).toBe(true);
  expect(state.pagination?.hasNext).toBe(true);
  expect(state.pagination?.pageKey).toBe(MOCK_PAGE_1_KEY);
  expect(state.fetchedPages.initial).toBeDefined();
});

test('should fetch next page when fetchNextNftCollectionPage is called', async () => {
  const store = createNftsStore(TEST_ADDRESS);

  // Set up initial state as if first page was already fetched
  const now = Date.now();
  store.setState({
    collections: new Map([
      ['collection1', createMockCollection('collection1', 'Collection 1')],
      ['collection2', createMockCollection('collection2', 'Collection 2')],
    ]),
    pagination: { hasNext: true, pageKey: MOCK_PAGE_1_KEY, total_elements: 5 },
    fetchedPages: { initial: now },
  });

  const mockNextPage = {
    nftCollections: {
      data: [createMockCollection('collection3', 'Collection 3'), createMockCollection('collection4', 'Collection 4')],
      nextPageKey: MOCK_PAGE_2_KEY,
      totalCollections: 5,
    },
  };

  (arcClient.getNftCollections as jest.Mock).mockResolvedValueOnce(mockNextPage);

  await store.getState().fetchNextNftCollectionPage();

  const state = store.getState();
  expect(state.collections.size).toBe(4);
  expect(state.collections.has('collection3')).toBe(true);
  expect(state.collections.has('collection4')).toBe(true);
  expect(state.pagination?.pageKey).toBe(MOCK_PAGE_2_KEY);
  expect(state.fetchedPages[MOCK_PAGE_1_KEY]).toBeDefined();
});

test('should refetch from beginning when pageKey is stale', async () => {
  const store = createNftsStore(TEST_ADDRESS);
  const oldTimestamp = Date.now() - PAGINATION_STALE_TIME - 1000;

  // Set up state with stale pageKey
  store.setState({
    collections: new Map([['collection1', createMockCollection('collection1', 'Collection 1')]]),
    pagination: { hasNext: true, pageKey: MOCK_PAGE_1_KEY, total_elements: 5 },
    fetchedPages: { initial: oldTimestamp },
  });

  const mockRefreshData = {
    nftCollections: {
      data: [createMockCollection('collection1-refreshed', 'Collection 1 Refreshed')],
      nextPageKey: 'new-page-key',
      totalCollections: 3,
    },
  };

  (arcClient.getNftCollections as jest.Mock).mockResolvedValueOnce(mockRefreshData);

  // Advance time to current
  jest.setSystemTime(Date.now());

  await store.getState().fetchNextNftCollectionPage();

  expect(arcClient.getNftCollections).toHaveBeenCalledWith(expect.objectContaining({ pageKey: null }));

  const state = store.getState();
  expect(state.collections.size).toBe(1);
  expect(state.collections.has('collection1-refreshed')).toBe(true);
  expect(state.pagination?.pageKey).toBe('new-page-key');
});

test('should handle pageKey error and refetch from beginning', async () => {
  const store = createNftsStore(TEST_ADDRESS);
  const now = Date.now();

  store.setState({
    collections: new Map([['collection1', createMockCollection('collection1', 'Collection 1')]]),
    pagination: { hasNext: true, pageKey: 'expired-key', total_elements: 5 },
    fetchedPages: { initial: now },
  });

  // Mock the fetch function from createQueryStore
  const fetchMock = jest
    .fn()
    .mockRejectedValueOnce(new Error('Invalid pageKey'))
    .mockResolvedValueOnce({
      collections: new Map([['collection1-new', createMockCollection('collection1-new', 'Collection 1 New')]]),
      nftsByCollection: new Map(),
      pagination: { hasNext: true, pageKey: 'fresh-key', total_elements: 3 },
    });

  // Replace the fetch function temporarily
  const originalFetch = store.getState().fetch;
  store.setState({ fetch: fetchMock });

  await store.getState().fetchNextNftCollectionPage();

  // Restore original fetch
  store.setState({ fetch: originalFetch });

  // Should have tried with pageKey first, then without
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ pageKey: 'expired-key', limit: PAGE_SIZE }), expect.any(Object));
  expect(fetchMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ pageKey: null, limit: PAGE_SIZE }), expect.any(Object));

  const state = store.getState();
  expect(state.collections.size).toBe(1);
  expect(state.collections.has('collection1-new')).toBe(true);
}, 10000);

test('should prevent concurrent pagination requests', async () => {
  const store = createNftsStore(TEST_ADDRESS);

  // Clear any initial data that might be cached
  store.setState({
    collections: new Map([['collection1', createMockCollection('collection1', 'Collection 1')]]),
    pagination: { hasNext: true, pageKey: MOCK_PAGE_1_KEY, total_elements: 5 },
    fetchedPages: { initial: Date.now() },
  });

  // Track how many times the API is called
  let apiCallCount = 0;
  (arcClient.getNftCollections as jest.Mock).mockImplementation(() => {
    apiCallCount++;
    // Return immediately instead of using setTimeout
    return Promise.resolve({
      nftCollections: {
        data: [createMockCollection('collection2', 'Collection 2')],
        nextPageKey: null,
        totalCollections: 2,
      },
    });
  });

  // Start multiple concurrent requests
  const promises = [
    store.getState().fetchNextNftCollectionPage(),
    store.getState().fetchNextNftCollectionPage(),
    store.getState().fetchNextNftCollectionPage(),
  ];

  // Wait for all promises to resolve
  await Promise.all(promises);

  // Only one API call should have been made despite 3 concurrent requests
  expect(apiCallCount).toBe(1);
}, 10000);

test('should not fetch when there are no more pages', async () => {
  const store = createNftsStore(TEST_ADDRESS);

  const initialState = {
    collections: new Map([['collection1', createMockCollection('collection1', 'Collection 1')]]),
    nftsByCollection: new Map(),
    pagination: { hasNext: false, pageKey: null, total_elements: 1 },
    fetchedPages: { initial: Date.now() },
    queryCache: {},
  };

  store.setState(initialState);

  // Capture the state before calling fetchNextNftCollectionPage
  const stateBefore = store.getState();

  // Call fetchNextNftCollectionPage
  await store.getState().fetchNextNftCollectionPage();

  // The state should not have changed
  const stateAfter = store.getState();
  expect(stateAfter.collections).toBe(stateBefore.collections);
  expect(stateAfter.nftsByCollection).toBe(stateBefore.nftsByCollection);
  expect(stateAfter.pagination).toBe(stateBefore.pagination);
  expect(stateAfter.fetchedPages).toBe(stateBefore.fetchedPages);
  expect(stateAfter.queryCache).toBe(stateBefore.queryCache);

  // Also verify no API calls were made
  expect(arcClient.getNftCollections).not.toHaveBeenCalled();
}, 10000);

test('should correctly report hasNextNftCollectionPage', async () => {
  const store = createNftsStore(TEST_ADDRESS);

  // Initially no pagination info
  expect(store.getState().hasNextNftCollectionPage()).toBe(false);

  // Set pagination info with hasNext = true
  store.setState({
    pagination: { hasNext: true, pageKey: MOCK_PAGE_1_KEY, total_elements: 20 },
  });
  expect(store.getState().hasNextNftCollectionPage()).toBe(true);

  // Set pagination info with hasNext = false
  store.setState({
    pagination: { hasNext: false, pageKey: null, total_elements: 10 },
  });
  expect(store.getState().hasNextNftCollectionPage()).toBe(false);
});

test('should not prune open collections when fetching a different collection', async () => {
  // Mock the open collections store with open collections
  useOpenCollectionsStore.setState({
    openCollections: {
      showcase: true,
      ethereum_0x123: true,
      ethereum_0x456: true,
    },
  });

  const store = createNftsStore(TEST_ADDRESS);

  // Mock getShowcase and getHidden to return empty arrays
  (getShowcase as jest.Mock).mockResolvedValue([]);
  (getHidden as jest.Mock).mockResolvedValue([]);

  // Set up initial state with two open collections
  const assetA = createMockUniqueAsset('ethereum_0x123_1' as UniqueAsset['uniqueId'], 'NFT A1');
  const assetB = createMockUniqueAsset('ethereum_0x456_1' as UniqueAsset['uniqueId'], 'NFT B1');

  store.setState({
    nftsByCollection: new Map([
      ['ethereum_0x123', new Map([['ethereum_0x123_1', assetA]])],
      ['ethereum_0x456', new Map([['ethereum_0x456_1', assetB]])],
    ]),
    fetchedCollections: {
      ethereum_0x123: Date.now(),
      ethereum_0x456: Date.now(),
    },
  });

  // Mock fetching collection A with new data
  const newNftForA = createMockUniqueAsset('ethereum_0x123_2' as UniqueAsset['uniqueId'], 'NFT A2');
  (arcClient.getNftsByCollection as jest.Mock).mockResolvedValueOnce({
    nftsByCollection: [newNftForA],
  });

  // Fetch collection A
  await store.getState().fetch({ collectionId: 'ethereum_0x123' });

  // Both collections should still be in the store
  const nftsByCollection = store.getState().nftsByCollection;
  expect(nftsByCollection.has('ethereum_0x123')).toBe(true);
  expect(nftsByCollection.has('ethereum_0x456')).toBe(true);

  // Collection A should have both NFTs
  const collectionANfts = nftsByCollection.get('ethereum_0x123');
  expect(collectionANfts?.size).toBe(2);
  expect(collectionANfts?.has('ethereum_0x123_1')).toBe(true);
  expect(collectionANfts?.has('ethereum_0x123_2')).toBe(true);

  // Collection B should still have its NFT
  const collectionBNfts = nftsByCollection.get('ethereum_0x456');
  expect(collectionBNfts?.size).toBe(1);
  expect(collectionBNfts?.has('ethereum_0x456_1')).toBe(true);
});
