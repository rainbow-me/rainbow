import { StoreApi } from 'zustand';
import { InferStoreState } from '../types';

type UnknownFunction = (...args: never[]) => unknown;

/** Extract the keys of T whose values are functions. */
type FunctionKeys<T> = {
  [K in keyof T]-?: T[K] extends UnknownFunction ? K : never;
}[keyof T];

type Methods = Record<string, UnknownFunction>;

type NoOverlap<State, Bundled extends Methods> = Extract<keyof Bundled, FunctionKeys<State>> extends never ? Bundled : never;

export type StoreActions<Store extends StoreApi<unknown>> = Pick<InferStoreState<Store>, FunctionKeys<InferStoreState<Store>>>;

/**
 * Given a Zustand store, produce a new object containing only its actions.
 *
 * Intended for export alongside the associated store.
 *
 * @param store - The store to create actions for.
 * @param bundledMethods - Optional extra methods to bundle into the actions object.
 *
 * @example
 * export const useCounterStore = createRainbowStore(set => ({
 *   count: 0,
 *   increment: () => set(state => ({ count: state.count + 1 })),
 * }));
 *
 * export const exampleActions = createStoreActions(useExampleStore);
 * exampleActions.increment();
 */
export function createStoreActions<Store extends StoreApi<unknown>>(store: Store): StoreActions<Store>;

export function createStoreActions<Store extends StoreApi<unknown>, Bundled extends Methods>(
  store: Store,
  bundledMethods: NoOverlap<InferStoreState<Store>, Bundled>
): StoreActions<Store> & Bundled;

export function createStoreActions<Store extends StoreApi<unknown>, Bundled extends Methods>(
  store: Store,
  bundledMethods?: NoOverlap<InferStoreState<Store>, Bundled>
): StoreActions<Store> | (StoreActions<Store> & Bundled) {
  const state = store.getState();
  const isObject = typeof state === 'object' && state !== null;
  if (!isObject) throw new Error('[createStoreActions]: State is not an object');

  const storeActions = extractFunctionProperties(state);
  if (!bundledMethods) return storeActions;

  return Object.assign(storeActions, bundledMethods);
}

function extractFunctionProperties<Store extends StoreApi<unknown>>(state: InferStoreState<Store>): StoreActions<Store> {
  const result: StoreActions<Store> = Object.create(null);
  for (const key in state) {
    if (isFunctionKey(state, key)) result[key] = state[key];
  }
  return result;
}

function isFunctionKey<State, K extends keyof State>(state: State, key: K): key is K & FunctionKeys<State> {
  return typeof state[key] === 'function';
}
