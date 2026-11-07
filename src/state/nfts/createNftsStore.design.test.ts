import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NftTokenType, type GetNftsByCollectionQuery } from '@/graphql/__generated__/arc';
import { buildBriefUniqueTokenList } from '@/helpers/assets';

import { createNftsStore } from './createNftsStore';

const api = vi.hoisted(() => ({ page: vi.fn(), collection: vi.fn(), metadata: vi.fn(), showcase: vi.fn(), hidden: vi.fn() }));
vi.mock('@/graphql', () => ({
  arcClient: { getNftCollections: api.page, getNftsByCollection: api.collection, getNftsMetadata: api.metadata },
}));
vi.mock('@/features/nfts/data/showcaseStore', () => ({ fetchShowcaseTokens: api.showcase }));
vi.mock('@/features/nfts/data/hiddenNftsStore', () => ({ fetchHiddenTokens: api.hidden }));
vi.mock('@/state/nfts/openCollectionsStore', () => ({
  useOpenCollectionsStore: { getState: () => ({ openCollections: { showcase: true } }) },
}));
vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: { getState: () => ({ getChainsIdByName: () => ({ mainnet: 1 }) }) },
}));
vi.mock('@/utils/handleNFTImages', () => ({ handleNFTImages: () => ({ highResUrl: undefined, lowResUrl: undefined }) }));

let accountIndex = 10;
function nextAddress(): string {
  accountIndex += 1;
  return `0x${accountIndex.toString(16).padStart(40, '0')}`;
}
const collectionId = 'mainnet_0x0000000000000000000000000000000000000001';
const first = `${collectionId}_42`;
const second = `${collectionId}_5000`;
const summary = { id: collectionId, name: 'Collection', totalCount: '2', imageUrl: null };
type NftFixture = Pick<
  GetNftsByCollectionQuery['nftsByCollection'][number],
  'uniqueId' | 'name' | 'standard' | 'type' | 'isSendable' | 'images' | 'traits'
>;
function nft(uniqueId: string): NftFixture {
  return { uniqueId, name: uniqueId, standard: NftTokenType.Erc721, type: 'nft', isSendable: true, images: {}, traits: [] };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.page.mockResolvedValue({ nftCollections: { data: [summary], nextPageKey: null, totalCollections: 1 } });
  api.collection.mockResolvedValue({ nftsByCollection: [nft(first), nft(second)] });
  api.metadata.mockResolvedValue({ getNftsMetadata: [nft(first)] });
  api.showcase.mockResolvedValue([first]);
  api.hidden.mockResolvedValue([]);
});

describe('NFT ownership publication', () => {
  it('retains full ownership after partial metadata and builds numeric ordinary rows from it', async () => {
    const store = createNftsStore(nextAddress());
    await store.getState().fetch(undefined, { force: true });
    await store.getState().fetchNftCollection(collectionId);
    const collections = store.getState().collections;
    await store.getState().fetchNftCollection('showcase', true);
    expect(store.getState().collections).toBe(collections);
    expect(store.getState().collections.get(collectionId)?.nfts?.ids).toEqual([first, second]);
    const rows = buildBriefUniqueTokenList(collections, [], [first], [], 'wallet', false, false, true, true, false);
    expect(rows).toContainEqual(expect.objectContaining({ type: 'FAMILY_HEADER', uid: collectionId, total: 1 }));
    expect(rows).toContainEqual(expect.objectContaining({ type: 'NFT', uniqueId: second }));
    expect(store.getState().getNft(collectionId, 1)).toBe(store.getState().getNftByUniqueId(second));
    store.getState().reset();
  });

  it('does not let preference-first metadata satisfy a full collection fetch', async () => {
    const store = createNftsStore(nextAddress());
    await store.getState().fetch(undefined, { force: true });
    api.showcase.mockResolvedValue([second]);
    api.metadata.mockResolvedValue({ getNftsMetadata: [nft(second)] });
    await store.getState().fetchNftCollection('showcase');
    expect(store.getState().collections.get(collectionId)?.nfts).toBeUndefined();
    api.showcase.mockResolvedValue([first]);
    await store.getState().fetchNftCollection(collectionId);
    expect(api.collection).toHaveBeenCalledTimes(1);
    expect(store.getState().collections.get(collectionId)?.nfts?.ids).toEqual([first, second]);
    store.getState().reset();
  });

  it('treats a fetched empty collection as known empty, without retrying or refetching on reopen', async () => {
    const store = createNftsStore(nextAddress());
    await store.getState().fetch(undefined, { force: true });
    api.collection.mockResolvedValue({ nftsByCollection: [] });
    await store.getState().fetchNftCollection(collectionId, true);
    await store.getState().fetchNftCollection(collectionId);
    expect(api.collection).toHaveBeenCalledTimes(1);
    expect(store.getState().collections.get(collectionId)?.nfts?.ids).toEqual([]);
    store.getState().reset();
  });

  it('deduplicates special-category calls before their preference read finishes', async () => {
    const store = createNftsStore(nextAddress());
    const a = store.getState().fetchNftCollection('showcase', true);
    const b = store.getState().fetchNftCollection('showcase');
    expect(a).toBe(b);
    await a;
    expect(api.metadata).toHaveBeenCalledTimes(1);
    store.getState().reset();
  });

  it('does not allow an older request to replace a later forced ownership result', async () => {
    const store = createNftsStore(nextAddress());
    await store.getState().fetch(undefined, { force: true });
    let finishOld: (response: { nftsByCollection: NftFixture[] }) => void = () => {
      throw new Error('The awaited request did not start');
    };
    api.collection.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishOld = resolve;
        })
    );
    const old = store.getState().fetchNftCollection(collectionId);
    await Promise.resolve();
    api.collection.mockResolvedValue({ nftsByCollection: [] });
    await store.getState().fetchNftCollection(collectionId, true);
    finishOld({ nftsByCollection: [nft(first), nft(second)] });
    await old;
    expect(store.getState().collections.get(collectionId)?.nfts?.ids).toEqual([]);
    store.getState().reset();
  });
});

it('migrates metadata without claiming old mixed maps prove owned membership', async () => {
  const store = createNftsStore(nextAddress());
  await store.getState().fetch(undefined, { force: true });
  await store.getState().fetchNftCollection(collectionId);
  const metadata = store.getState().nfts;
  const migration = store.persist?.getOptions().migrate;
  const converted = await migration?.(
    {
      collections: new Map([[collectionId, summary]]),
      nftsByCollection: new Map([[collectionId, metadata]]),
      pagination: { pageKey: null, hasNext: false },
    },
    1
  );
  expect(converted?.nfts?.get(first)).toBe(metadata.get(first));
  expect(converted?.collections?.get(collectionId)?.nfts).toBeUndefined();
  expect(converted).not.toHaveProperty('nftsByCollection');
  expect(converted).not.toHaveProperty('queryCache');
  store.getState().reset();
});

it('prunes current closed data and retains a publication completed during the preference await', async () => {
  const { pruneStaleAndClosedCollections } = await import('./collectionPruning');
  const store = createNftsStore(nextAddress());
  await store.getState().fetch(undefined, { force: true });
  await store.getState().fetchNftCollection(collectionId);
  const collection = store.getState().collections.get(collectionId);
  if (!collection?.nfts) throw new Error('Full collection fixture failed to load');
  store.setState({ collections: new Map([[collectionId, { ...collection, nfts: { ...collection.nfts, fetchedAt: 0 } }]]) });
  api.showcase.mockResolvedValue([]);
  await pruneStaleAndClosedCollections({ address: '0x0000000000000000000000000000000000000001', set: store.setState });
  expect(store.getState().collections.get(collectionId)?.nfts).toBeUndefined();
  expect(store.getState().nfts.size).toBe(0);

  let releasePreferences: (ids: string[]) => void = () => {
    throw new Error('The awaited request did not start');
  };
  api.showcase.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        releasePreferences = resolve;
      })
  );
  const pruning = pruneStaleAndClosedCollections({ address: '0x0000000000000000000000000000000000000001', set: store.setState });
  await store.getState().fetchNftCollection(collectionId, true);
  const before = store.getState();
  releasePreferences([]);
  await pruning;
  expect(store.getState()).toBe(before);
  expect(store.getState().getNft(collectionId, 0)).not.toBeNull();
  store.getState().reset();
});

it('invalidates a full result when a newer summary contradicts its owned count', async () => {
  const store = createNftsStore(nextAddress());
  await store.getState().fetch(undefined, { force: true });
  api.collection.mockResolvedValue({ nftsByCollection: [] });
  await store.getState().fetchNftCollection(collectionId, true);
  expect(store.getState().collections.get(collectionId)?.nfts?.ids).toEqual([]);

  api.page.mockResolvedValue({ nftCollections: { data: [{ ...summary, totalCount: '1' }], nextPageKey: null, totalCollections: 1 } });
  await store.getState().fetch(undefined, { force: true });
  expect(store.getState().collections.get(collectionId)?.nfts).toBeUndefined();
  api.collection.mockResolvedValue({ nftsByCollection: [nft(first)] });
  await store.getState().fetchNftCollection(collectionId);
  const fullResult = store.getState().collections.get(collectionId)?.nfts;
  expect(fullResult?.ids).toEqual([first]);

  await store.getState().fetch(undefined, { force: true });
  expect(store.getState().collections.get(collectionId)?.nfts).toBe(fullResult);
  store.getState().reset();
});
