import { StoreApi } from 'zustand';
import { BaseRainbowStore, DerivedStore, PersistedRainbowStore, WithGetSnapshot } from '../types';

export function getStoreName(store: BaseRainbowStore<unknown>): string {
  const name = isPersistedStore(store) ? store.persist.getOptions().name : store.name;
  return name ?? store.name;
}

/**
 * Checks if a store is a `DerivedStore` and reveals its internal `getSnapshot` method.
 */
export function hasGetSnapshot<S>(store: BaseRainbowStore<S> | StoreApi<S>): store is WithGetSnapshot<DerivedStore<S>> {
  return 'getSnapshot' in store;
}

/**
 * Checks if a store is a `DerivedStore`.
 */
export function isDerivedStore<S>(store: BaseRainbowStore<S> | StoreApi<S>): store is DerivedStore<S> {
  return 'flushUpdates' in store;
}

/**
 * Checks if a store is persisted.
 */
export function isPersistedStore<S>(store: BaseRainbowStore<S>): store is PersistedRainbowStore<S> {
  return 'persist' in store;
}
