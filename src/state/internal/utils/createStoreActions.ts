import { BaseRainbowStore } from '../types';

/** Extract the keys of T whose values are functions */
type FunctionKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];

type StoreActions<T> = Pick<T, FunctionKeys<T>>;

/**
 * Given a Zustand store, produce a new object containing only its actions.
 *
 * Intended for export alongside the associated store.
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
export function createStoreActions<State>(store: BaseRainbowStore<State>): StoreActions<State> {
  const state = store.getState();
  const isObject = typeof state === 'object' && state !== null;
  if (!isObject) throw new Error('[createStoreActions]: State is not an object');
  return extractFunctionProperties(state);
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
