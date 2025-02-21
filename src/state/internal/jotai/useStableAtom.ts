import { Atom, WritableAtom, useAtom } from 'jotai';
import { useState } from 'react';

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
 * // Initialize with a function:
 * const countAtom = useStableAtom(() => atom(initialCount));
 *
 * // Or pass an atom directly:
 * const countAtom = useStableAtom(atom(initialCount));
 * ```
 */
export function useStableAtom<T, A extends Atom<T>>(atom: A | (() => A)): A {
  const [stableAtom] = useState<A>(isLazyInitializer<T, A>(atom) ? atom() : atom);
  return stableAtom;
}

/**
 * **A hook that returns the value and updater of a stable Jotai atom.**
 *
 * This hook builds on `useStableAtom` by immediately subscribing to the atom's state with
 * Jotai's `useAtom`. It returns the current state and an updater function for writable atoms.
 *
 * @param atom - An atom or a function returning an atom.
 *
 * @example
 * ```ts
 * const [erroredChainIds] = useStableAtomValue(
 *   selectAtom(queryAtom, get => get.data?.chainIdsWithErrors ?? EMPTY_CHAIN_IDS, dequal)
 * );
 * ```
 */
export function useStableAtomValue<T, Args extends unknown[], Result>(
  atom: WritableAtom<T, Args, Result> | (() => WritableAtom<T, Args, Result>)
): [T, (...args: Args) => Result];
export function useStableAtomValue<T>(atom: Atom<T> | (() => Atom<T>)): [T, never];
export function useStableAtomValue<T, A extends Atom<T>>(atom: A | (() => A)) {
  const stableAtom = useStableAtom<T, A>(atom);
  return useAtom(stableAtom);
}

/**
 * Type guard to check if the given atom value is a lazy initializer.
 *
 * @param atom - Either a direct atom or a function returning one.
 * @returns true if `atom` is a function.
 */
function isLazyInitializer<T, A extends Atom<T>>(atom: A | (() => A)): atom is () => A {
  return typeof atom === 'function';
}
