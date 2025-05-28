import { debounce, identity } from 'lodash';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { StoreApi } from 'zustand/vanilla';
import { IS_DEV } from '@/env';
import { pluralize } from '@/worklets/strings';
import { createPathFinder, getOrCreateProxy, PathFinder } from './derivedStore/deriveProxy';
import {
  BaseRainbowStore,
  DebounceOptions,
  DeriveOptions,
  DerivedRainbowStore,
  EqualityFn,
  Listener,
  RainbowStore,
  Selector,
  SubscribeArgs,
  UnsubscribeFn,
  WithFlushUpdates,
} from './types';

// ============ Store Creator ================================================== //

/**
 * ### `createDerivedStore`
 *
 * Creates a **read-only** store derived from one or more underlying Zustand stores.
 *
 * ---
 * The `deriveFunction` is called whenever its dependencies change, producing a new derived state.
 * Dependencies are automatically tracked through a special `$` helper, which supports:
 *
 * 1) **Selector-based** usage:
 *    ```ts
 *    $ => {
 *      const user = $(useUserStore, s => s.user, shallowEqual);
 *      const theme = $(useSettingsStore, s => s.appearance.theme);
 *      return { user, theme, isAdmin: user?.roles.includes('admin') };
 *    }
 *    ```
 *
 * 2) **Proxy-based** usage (auto-built selectors for nested properties):
 *    ```ts
 *    $ => {
 *      const { user } = $(useUserStore); // Subscribe to `user`
 *      const theme = $(useSettingsStore).appearance.theme; // Subscribe to `theme`
 *      return { isAdmin: user?.roles.includes('admin'), theme, user };
 *    }
 *    ```
 *
 * ---
 * Derived stores automatically unsubscribe from all dependencies when no consumers remain, and
 * resubscribe when new consumers appear. The returned function doubles as:
 *
 * - A **React hook** (`const state = useDerivedStore(selector, equalityFn?)`)
 * - A **store object** with `getState()`, `subscribe()`, and `destroy()`
 *
 * ---
 * You can optionally pass a second parameter (either an equality function or a config object)
 * to enable debouncing, customize the equality function, or set `stableSubscriptions: true`.
 *
 * (If stable subscriptions are enabled, dependencies are established once and are not rebuilt
 * on subsequent re-derives, which can be a performance win for certain workloads.)
 *
 * ---
 * @example
 * ```ts
 * // Create a derived store
 * const useSearchResults = createDerivedStore($ => {
 *   const query = $(useSearchStore).query.trim().toLowerCase();
 *   const items = $(useItemsStore).items;
 *   return findResults(query, items);
 * }, shallowEqual);
 *
 * function SearchResults() {
 *   // Consume the derived state
 *   const results = useSearchResults(); // Or (selector, equalityFn?)
 *   return <ResultsList items={results} />;
 * }
 * ```
 *
 * ---
 * @param deriveFunction - Function that reads from other stores via `$` to produce derived state.
 * @param optionsOrEqualityFn - Either an equality function or a config object (see `DeriveOptions`).
 *
 * @returns A read-only derived store (usable as a hook or standard store object).
 */
export function createDerivedStore<Derived>(
  deriveFunction: ($: DeriveGetter) => Derived,
  optionsOrEqualityFn: DeriveOptions<Derived> = Object.is
): DerivedRainbowStore<Derived> {
  return attachStoreHook(derive(deriveFunction, optionsOrEqualityFn));
}

function attachStoreHook<S>(store: WithFlushUpdates<StoreApi<S>>): DerivedRainbowStore<S> {
  function useDerivedStore(): S;
  function useDerivedStore<T>(selector: (state: S) => T, equalityFn?: EqualityFn<T>): T;
  function useDerivedStore<T>(selector: (state: S) => T = identity, equalityFn: EqualityFn<T> = Object.is): S | T {
    return useStoreWithEqualityFn(store, selector, equalityFn);
  }
  return Object.assign(useDerivedStore, store);
}

// ============ Types ========================================================== //

export type DeriveGetter = {
  <S>(store: RainbowStore<S>): S;
  <S, Selected>(store: RainbowStore<S>, selector: Selector<S, Selected>, equalityFn?: EqualityFn<Selected>): Selected;
};

/**
 * A `Watcher` is either:
 * - Plain listener (state, prevState)
 * - Selector-based listener
 */
type Watcher<DerivedState, Selected = unknown> =
  | Listener<DerivedState>
  | {
      currentSlice: Selected;
      equalityFn: EqualityFn<Selected>;
      listener: Listener<Selected>;
      selector: Selector<DerivedState, Selected>;
    };

// ============ Core Derive Function =========================================== //

/**
 * Powers the internals of `createDerivedStore`.
 *
 * - Intercepts `$` calls in `deriveFunction` to track and subscribe to dependencies.
 * - Recomputes derived state whenever dependencies change (optionally debounced).
 * - Notifies all subscribers in a single pass if the derived state (or their slice) has changed.
 * - Cleans up subscriptions and internal state when no subscribers (watchers) remain.
 */
function derive<DerivedState>(
  deriveFunction: ($: DeriveGetter) => DerivedState,
  optionsOrEqualityFn: DeriveOptions<DerivedState> = Object.is
): WithFlushUpdates<StoreApi<DerivedState>> {
  const { debounceOptions, debugMode, equalityFn, useStableSubscriptions } = getOptions(optionsOrEqualityFn);

  // Active subscriptions *to* the derived store
  const watchers = new Set<Watcher<DerivedState>>();

  // For subscriptions created by `$` within `derive`
  const unsubscribes = new Set<UnsubscribeFn<true>>();

  // Lazily built proxy helpers
  let rootProxyCache: WeakMap<StoreApi<unknown>, unknown> | undefined;
  let pathFinder: PathFinder | undefined;

  // Core state
  let derivedState: DerivedState | undefined;
  let deriveScheduled = false;
  let invalidated = true;
  let shouldRebuildSubscriptions = true;

  function $<S>(store: BaseRainbowStore<S>): S;
  function $<S, Selected>(store: BaseRainbowStore<S>, selector: Selector<S, Selected>, equalityFn?: EqualityFn<Selected>): Selected;
  function $<S, Selected = S>(
    store: BaseRainbowStore<S>,
    selector: Selector<S, Selected> = identity,
    equalityFn: EqualityFn<Selected> = Object.is
  ): Selected | S {
    // Build subscriptions only if the derived store has watchers
    if (shouldRebuildSubscriptions && watchers.size) {
      if (arguments.length === 1) {
        // -- Overload #1: $(store).maybe.a.path
        if (!rootProxyCache) rootProxyCache = new WeakMap();
        if (!pathFinder) pathFinder = createPathFinder();
        return getOrCreateProxy(store, rootProxyCache, pathFinder.trackPath);
      }

      // -- Overload #2: $(store, selector, equalityFn?)
      // No proxy, just a direct subscription to the store
      const unsubscribe = store.subscribe(selector, () => invalidate(), { equalityFn });
      unsubscribes.add(unsubscribe);
    }

    return selector(store.getState());
  }

  function unsubscribeAll(skipAbortFetch?: boolean): void {
    for (const unsub of unsubscribes) unsub(skipAbortFetch);
    unsubscribes.clear();
  }

  function derive(): DerivedState {
    if (!invalidated && derivedState !== undefined) return derivedState;
    invalidated = false;

    // If we need to rebuild subscriptions, unsubscribe existing ones first
    if (shouldRebuildSubscriptions) unsubscribeAll(true);

    const prevState = derivedState;
    derivedState = deriveFunction($);
    if (!watchers.size) return derivedState;

    const hasPreviousState = prevState !== undefined;
    const shouldLogSubscriptions = debugMode && !hasPreviousState;

    if (shouldLogSubscriptions) {
      console.log('[🌀 Initial Derive Complete 🌀]: Created...');
      const subscriptionCount = unsubscribes.size;
      console.log(`[🎯 ${subscriptionCount} ${pluralize('Selector Subscription', subscriptionCount)} 🎯]`);
    }

    if (pathFinder && shouldRebuildSubscriptions) {
      // Create subscriptions for each proxy-generated dependency path
      pathFinder.buildProxySubscriptions((store, selector) => {
        const unsub = store.subscribe(selector, () => invalidate(), { equalityFn: Object.is });
        unsubscribes.add(unsub);
      }, shouldLogSubscriptions);
      // Reset proxy state for the next derivation
      rootProxyCache = undefined;
      pathFinder = undefined;
    }

    // Lock in subscriptions so we only build once
    if (useStableSubscriptions) shouldRebuildSubscriptions = false;

    // Notify watchers if derived state changed
    if (hasPreviousState && !equalityFn(prevState, derivedState)) {
      for (const w of watchers) {
        if (typeof w === 'function') {
          w(derivedState, prevState ?? derivedState);
        } else {
          const newSlice = w.selector(derivedState);
          if (!w.equalityFn(w.currentSlice, newSlice)) {
            const oldSlice = w.currentSlice;
            w.currentSlice = newSlice;
            w.listener(newSlice, oldSlice);
          }
        }
      }
      if (debugMode) {
        console.log(`[📻 New Derived Value 📻]: Notified ${watchers.size} ${pluralize('watcher', watchers.size)}`);
      }
    } else if (debugMode && hasPreviousState) {
      console.log(`[🥷 Derive Complete 🥷]: No change detected`);
    }

    return derivedState;
  }

  const debouncedDerive = debounceOptions
    ? debounce(
        runDerive,
        typeof debounceOptions === 'number' ? debounceOptions : debounceOptions.delay,
        typeof debounceOptions === 'number' ? { leading: false, maxWait: debounceOptions, trailing: true } : debounceOptions
      )
    : undefined;

  const scheduleDerive =
    debouncedDerive ??
    (() => {
      if (deriveScheduled) return;
      deriveScheduled = true;
      queueMicrotask(runDerive);
    });

  function runDerive(): void {
    deriveScheduled = false;
    if (!invalidated) return;
    derive();
  }

  function invalidate(): void {
    if (!invalidated) {
      invalidated = true;
      scheduleDerive();
    }
  }

  function getState(): DerivedState {
    if (derivedState === undefined) {
      if (watchers.size) return derive();
      else return deriveFunction($);
    }
    return derivedState;
  }

  function subscribe(...args: SubscribeArgs<DerivedState>): UnsubscribeFn {
    // -- Overload #1: single argument: (listener)
    if (args.length === 1) {
      const listener = args[0];
      watchers.add(listener);

      if (watchers.size === 1) {
        derivedState = undefined;
        derive();
      }

      return () => {
        watchers.delete(listener);
        if (!watchers.size) destroy();
      };
    }

    // -- Overload #2: (selector, listener, { equalityFn, fireImmediately })
    const [selector, listener, options] = args;
    const eqFn = options?.equalityFn ?? Object.is;

    const watcher: Watcher<DerivedState> = {
      currentSlice: undefined,
      equalityFn: eqFn,
      listener,
      selector,
    };

    watchers.add(watcher);
    if (watchers.size === 1) {
      derivedState = undefined;
      derive();
    }

    const slice = selector(getState());
    watcher.currentSlice = slice;
    if (options?.fireImmediately) listener(slice, slice);

    return () => {
      watchers.delete(watcher);
      if (!watchers.size) destroy();
    };
  }

  function flushUpdates(): void {
    if (watchers.size) debouncedDerive?.flush();
  }

  function destroy(): void {
    debouncedDerive?.cancel();
    unsubscribeAll();
    watchers.clear();
    pathFinder = undefined;
    rootProxyCache = undefined;
    shouldRebuildSubscriptions = true;
    deriveScheduled = false;
    invalidated = true;
    derivedState = undefined;
  }

  return {
    destroy,
    flushUpdates,
    getState,
    subscribe,
    // -- Not applicable to derived stores
    getInitialState: () => {
      throw new Error('[createDerivedStore]: getInitialState() is not available on derived stores.');
    },
    setState: () => {
      throw new Error('[createDerivedStore]: setState() is not available on derived stores.');
    },
  };
}

// ============ Helpers ======================================================== //

function getOptions<DerivedState>(options: DeriveOptions<DerivedState>): {
  debounceOptions: number | DebounceOptions | undefined;
  debugMode: boolean;
  equalityFn: EqualityFn<DerivedState>;
  useStableSubscriptions: boolean;
} {
  if (typeof options === 'function') {
    return {
      debounceOptions: undefined,
      debugMode: false,
      equalityFn: options,
      useStableSubscriptions: false,
    };
  }
  return {
    debounceOptions: options.debounce,
    debugMode: (IS_DEV && options.debugMode) ?? false,
    equalityFn: options.equalityFn ?? Object.is,
    useStableSubscriptions: options.stableSubscriptions ?? false,
  };
}
