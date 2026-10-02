import { createBaseStore } from '@storesjs/stores';
import { expect, it, vi } from 'vitest';

import { rainbowStorage } from '@/state/internal/rainbowStorage';

it('hydrates real stores from the configured storage before the first read', () => {
  const storageKey = 'test-store-hydration';
  rainbowStorage.set(storageKey, JSON.stringify({ state: { count: 1 }, version: 0 }));
  const store = createBaseStore(() => ({ count: 0 }), { storageKey });
  expect(store.getState().count).toBe(1);
  store.persist.clearStorage();
});

it('preserves the real store implementation when configuring storage', async () => {
  const stores = await vi.importActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  expect(createBaseStore).toBe(stores.createBaseStore);
});
