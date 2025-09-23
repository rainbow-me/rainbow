import { BaseRainbowStore } from '../types';

type UnknownFunction = (...args: never[]) => unknown;

/** Extract the keys of T whose values are functions. */
type FunctionKeys<T> = {
  [K in keyof T]-?: T[K] extends UnknownFunction ? K : never;
}[keyof T];

type Methods = Record<string, UnknownFunction>;

type NoOverlap<State, Bundled extends Methods> = Extract<keyof Bundled, FunctionKeys<State>> extends never ? Bundled : never;

type StoreActions<State> = Pick<State, FunctionKeys<State>>;

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
export function createStoreActions<State>(store: BaseRainbowStore<State>): StoreActions<State>;

export function createStoreActions<State, Bundled extends Methods>(
  store: BaseRainbowStore<State>,
  bundledMethods: NoOverlap<State, Bundled>
): StoreActions<State> & Bundled;

export function createStoreActions<State, Bundled extends Methods>(
  store: BaseRainbowStore<State>,
  bundledMethods?: NoOverlap<State, Bundled>
): StoreActions<State> | (StoreActions<State> & Bundled) {
  const state = store.getState();
  const isObject = typeof state === 'object' && state !== null;
  if (!isObject) throw new Error('[createStoreActions]: State is not an object');

  const storeActions = extractFunctionProperties(state);
  if (!bundledMethods) return storeActions;

  return Object.assign(storeActions, bundledMethods);
}

function extractFunctionProperties<State>(state: State): StoreActions<State> {
  const result: StoreActions<State> = Object.create(null);
  for (const key in state) {
    if (isFunctionKey(state, key)) result[key] = state[key];
  }
  return result;
}

function isFunctionKey<State, K extends keyof State>(state: State, key: K): key is K & FunctionKeys<State> {
  return typeof state[key] === 'function';
}
