import { BaseRainbowStore, DerivedStore, PersistedRainbowStore } from '../types';

export function getStoreName(store: BaseRainbowStore<unknown>): string {
  const name = isPersistedStore(store) ? store.persist.getOptions().name : store.name;
  return name ?? store.name;
}

export function isDerivedStore(store: BaseRainbowStore<unknown>): store is DerivedStore<unknown> {
  return 'flushUpdates' in store;
}

export function isPersistedStore(store: BaseRainbowStore<unknown>): store is PersistedRainbowStore<unknown> {
  return 'persist' in store;
}
