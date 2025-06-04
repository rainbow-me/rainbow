import { Atom, WritableAtom, useAtom, useAtomValue } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { DependencyList, useCallback } from 'react';
import { useStableValue } from '@/hooks/useStableValue';
import { isDependencyList } from './utils';

/**
 * **A hook that returns a stable Jotai atom instance.**
 *
 * Ensures atoms created in components, hooks, or contexts remain stable across renders.
 * Accepts either a direct Jotai atom or a function that returns one.
 *
 * @param atom - An atom or a function returning an atom.
 *
 * @example
 * ```ts
 * // Pass an atom directly:
 * const countAtom = useStableAtom(() => atom(initialCount));
 *
 * // Or initialize with a function:
 * const countAtom = useStableAtom(() => atom(initialCount));
 * ```
 */
export function useStableAtom<T, A extends Atom<T>>(atom: () => A): A {
  const stableAtom = useStableValue<A>(() => atom());
  return stableAtom;
}

/**
 * **A hook that creates a stable atom and directly exposes its value and updater.**
 *
 * This hook builds on `useStableAtom` by immediately subscribing to the atom's state with
 * Jotai's `useAtom`. It returns the current state and an updater function for writable atoms.
 *
 * @param atom - A function returning an atom.
 *
 * @example
 * ```ts
 * // Create a writable atom:
 * const [tokenData, setTokenData] = useStableAtomValue(() =>
 *   atom<FormattedExternalAsset | null>(null)
 * );
 *
 * // Create a read-only derived atom:
 * const [tokenPrice] = useStableAtomValue(() =>
 *   atom(get => get(tokenData)?.native.price.display ?? '$0.00')
 * );
 * ```
 */
export function useStableAtomValue<T, Args extends unknown[], Result>(
  atom: () => WritableAtom<T, Args, Result>
): [T, (...args: Args) => Result];
export function useStableAtomValue<T>(atom: () => Atom<T>): [T, never];
export function useStableAtomValue<T, A extends Atom<T>>(atom: () => A) {
  const stableAtom = useStableAtom<T, A>(atom);
  return useAtom(stableAtom);
}

/**
 * **A hook that combines Jotai's useAtomValue and selectAtom utilities.**
 *
 * Provides a stable, memoized subscription to a derived value from an atom's state. The selector
 * function runs whenever the source atom updates, but re-renders only occur when the selected
 * value changes according to the provided equality function (or `Object.is` if not provided).
 *
 * @param atom - The source atom to select from. This should be a stable reference to an atom.
 * @param selector - A function that receives the atom's state and returns a derived value.
 * @param equalityFn (or dependency list) - Either:
 *   - an equality function `(prev: Selected, next: Selected) => boolean`, or
 *   - a dependency list for memoizing the selector (if no custom equality function is provided).
 * @param deps - Optional dependency list when a custom equality function is provided as the third argument.
 *
 * @example
 * ```ts
 * // Standard usage:
 * const name = useSelectAtom(userAtom, state => state.name);
 *
 * // Pass dependencies to rebuild the selector based on external state:
 * const selectedTokenColor = useSelectAtom(
 *   tokensAtom,
 *   state => getSelectedColor(state, selectedTokenId),
 *   [selectedTokenId]
 * );
 *
 * // Complex derivation with deep equality:
 * const processedData = useSelectAtom(
 *   dataAtom,
 *   state => processData(state),
 *   dequal
 * );
 * ```
 */
export function useSelectAtom<T, Selected>(atom: Atom<T>, selector: (state: T) => Selected, deps: DependencyList): Selected;

export function useSelectAtom<T, Selected>(
  atom: Atom<T>,
  selector: (state: T) => Selected,
  equalityFn?: (a: Selected, b: Selected) => boolean,
  deps?: DependencyList
): Selected;

export function useSelectAtom<T, Args extends unknown[], Result, Selected>(
  atom: WritableAtom<T, Args, Result>,
  selector: (state: T) => Selected,
  deps: DependencyList
): Selected;

export function useSelectAtom<T, Args extends unknown[], Result, Selected>(
  atom: WritableAtom<T, Args, Result>,
  selector: (state: T) => Selected,
  equalityFn?: (a: Selected, b: Selected) => boolean,
  deps?: DependencyList
): Selected;

export function useSelectAtom<T, A extends Atom<T>, Selected>(
  atom: A,
  selector: (state: T) => Selected,
  eqFnOrDeps: ((a: Selected, b: Selected) => boolean) | DependencyList = Object.is,
  providedDeps: DependencyList = []
): Selected {
  const arg3IsDeps = isDependencyList(eqFnOrDeps);
  const equalityFn = arg3IsDeps ? Object.is : eqFnOrDeps;
  const deps = arg3IsDeps ? eqFnOrDeps : providedDeps;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedSelector = useCallback(selector, deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedEqFn = useCallback(equalityFn, []);

  return useAtomValue(selectAtom(atom, memoizedSelector, memoizedEqFn));
}
