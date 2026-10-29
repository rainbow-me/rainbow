import React, { act } from 'react';

import { createBaseStore, useListen } from '@storesjs/stores';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { expect, it, vi } from 'vitest';

import { createSelectorReadTracker } from './createSelectorReadTracker';

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const ROOT_TAG = 101;

it.each(['store hook', 'useListen'])('tracks reads for the lifetime of a %s consumer', kind => {
  const reads = createSelectorReadTracker<string>();
  let observedKeys: string[] = [];

  const store = createBaseStore(() => ({
    read(key: string): number {
      reads.track(key);
      return 0;
    },
  }));

  const useStore = reads.install(store, keys => {
    observedKeys = keys;
  });

  function StoreConsumer() {
    useStore(s => s.read('BTC'));
    return null;
  }

  function ListenConsumer() {
    useListen(
      useStore,
      s => s.read('BTC'),
      () => undefined
    );
    return null;
  }

  const Consumer = kind === 'store hook' ? StoreConsumer : ListenConsumer;

  try {
    act(() => renderer.render(<Consumer />, ROOT_TAG, undefined, undefined));
    expect(observedKeys).toEqual(['BTC']);
  } finally {
    act(() => renderer.unmountComponentAtNode(ROOT_TAG));
  }

  expect(observedKeys).toEqual([]);
});
