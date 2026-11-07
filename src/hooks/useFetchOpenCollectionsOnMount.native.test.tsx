import React, { act } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, expect, it, vi } from 'vitest';

import { useNftsStore } from '@/state/nfts/nfts';

import useFetchOpenCollectionsOnMount from './useFetchOpenCollectionsOnMount';

const actions = vi.hoisted(() => ({ first: vi.fn(async () => undefined), second: vi.fn(async () => undefined) }));
const collectionId = 'mainnet_0x0000000000000000000000000000000000000001';
vi.mock('@/state/nfts/nfts', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  const id = 'mainnet_0x0000000000000000000000000000000000000001';
  return {
    useNftsStore: createBaseStore(() => ({
      fetchNftCollection: actions.first,
      collections: new Map([[id, { id, name: 'Collection', totalCount: '1', imageUrl: null }]]),
    })),
  };
});
vi.mock('@/state/nfts/openCollectionsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return {
    useOpenCollectionsStore: createBaseStore(() => ({ openCollections: { mainnet_0x0000000000000000000000000000000000000001: true } })),
  };
});
vi.mock('@/features/nfts/data/showcaseStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useShowcaseStore: createBaseStore(() => ({ getData: () => null })) };
});
vi.mock('@/features/nfts/data/hiddenNftsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useHiddenNftsStore: createBaseStore(() => ({ getData: () => null })) };
});
const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
function Consumer(): null {
  useFetchOpenCollectionsOnMount();
  return null;
}

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(311));
  vi.unstubAllGlobals();
});

it('cancels replaced and unmounted warm-ups instead of redirecting queued callbacks', async () => {
  let nextId = 0;
  const scheduled = new Map<number, IdleRequestCallback>();
  vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback): number => {
    nextId += 1;
    scheduled.set(nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelIdleCallback', (id: number): void => {
    scheduled.delete(id);
  });

  act(() => renderer.render(<Consumer />, 311, undefined, undefined));
  expect(scheduled.size).toBe(1);
  act(() => useNftsStore.setState({ fetchNftCollection: actions.second }));
  expect(scheduled.size).toBe(1);
  act(() => useNftsStore.setState({ fetchNftCollection: actions.first }));
  expect(scheduled.size).toBe(1);

  await act(async () => {
    for (const [id, callback] of scheduled) {
      scheduled.delete(id);
      callback({ didTimeout: false, timeRemaining: () => 50 });
    }
  });
  expect(actions.first).toHaveBeenCalledExactlyOnceWith(collectionId);
  expect(actions.second).not.toHaveBeenCalled();

  act(() => useNftsStore.setState({ fetchNftCollection: actions.second }));
  act(() => renderer.unmountComponentAtNode(311));
  expect(scheduled.size).toBe(0);
});
