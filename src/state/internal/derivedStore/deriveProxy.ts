import { StoreApi } from 'zustand/vanilla';
import { generateUniqueId } from '@/worklets/strings';
import { BaseRainbowStore, PersistedRainbowStore, Selector } from '../types';

// ============ Types ========================================================== //

export type PathEntry = {
  path: string[];
  store: BaseRainbowStore<unknown>;
  invocation?: TrackedInvocation;
};

export type TrackedInvocation = {
  args: unknown[] | undefined;
  method: string;
};

type PathTracker = (store: BaseRainbowStore<unknown>, path: string[], invocation?: TrackedInvocation) => void;

type SubscriptionBuilder = (store: BaseRainbowStore<unknown>, selector: Selector<unknown, unknown>) => void;

// ============ Proxy Creator ================================================== //

/**
 * Creates a lightweight tracking proxy that records path access and store method
 * invocations via proxy traps. Used to auto-generate selectors that point
 * to either the accessed path or the value returned by invoking a store method.
 */
export function createTrackingProxy<S>(snapshot: S, store: BaseRainbowStore<unknown>, trackPath: PathTracker, path: string[] = []): S {
  const bailedOutObjects = new WeakSet<object>();
  const subProxyCache = new WeakMap<object, object>();
  return buildProxy(snapshot, path, store, trackPath, bailedOutObjects, subProxyCache);
}

export function getOrCreateProxy<S>(
  store: BaseRainbowStore<S>,
  rootProxyCache: WeakMap<BaseRainbowStore<unknown>, unknown>,
  trackPath: PathTracker
): S {
  // Safely cast from <BaseRainbowStore<unknown>> to <BaseRainbowStore<S>>.
  // (The WeakMap can't handle generics.)
  const proxyByStore = rootProxyCache.get(store) as S | undefined;

  if (!proxyByStore) {
    const snapshot = store.getState();
    const newProxy = createTrackingProxy(snapshot, store, trackPath);
    rootProxyCache.set(store, newProxy);
    return newProxy;
  }
  return proxyByStore;
}

function buildProxy<T>(
  value: T,
  path: string[],
  store: BaseRainbowStore<unknown>,
  trackPath: PathTracker,
  bailedOutObjects: WeakSet<object>,
  subProxyCache: WeakMap<object, object>
): T {
  // If `value` is primitive or nullish, treat it as an object
  const isObjectLike = value && typeof value === 'object';
  const proxyTarget = isObjectLike ? value : Object(value);

  return new Proxy(proxyTarget, {
    get(target, propKey, receiver) {
      // -- If we've already bailed out on this object, no further sub-proxy
      if (bailedOutObjects.has(target)) {
        return Reflect.get(target, propKey, receiver);
      }

      // -- If it's a symbol or __proto__, handle normally (and bail out on iteration)
      if (propKey === '__proto__' || typeof propKey === 'symbol') {
        if (propKey === Symbol.iterator) {
          trackPath(store, path);
          bailedOutObjects.add(target);
        }
        return Reflect.get(target, propKey, receiver);
      }

      // -- Get the property
      const childValue = Reflect.get(target, propKey, receiver);
      const propertyString = String(propKey);

      // -- Detect if it's an own-property function (a store method)
      if (typeof childValue === 'function') {
        const isStoreMethod = Object.prototype.hasOwnProperty.call(target, propKey);

        if (isStoreMethod) {
          // We do not call trackPath(...) yet for the function reference.
          // Instead we return a function proxy that, when called, records the invocation.
          // This allows us to build a selector that points to the value returned by the method call.
          return function (...args: unknown[]) {
            trackPath(store, path.concat(propertyString), {
              method: propertyString,
              args: args.length ? args : undefined,
            });

            // Call the method with 'this' = the raw target
            return Reflect.apply(childValue, target, args);
          };
        } else {
          // Built-in / Prototype function (e.g. .toLowerCase())
          // For this, we do trackPath as a normal property get
          trackPath(store, path.concat(propertyString));
          return childValue.bind(value);
        }
      }

      // -- Non-function property
      // We track path here (a normal property get)
      trackPath(store, path.concat(propertyString));

      // If it's object-like, create or reuse a sub-proxy
      if (childValue && typeof childValue === 'object') {
        if (!subProxyCache.has(childValue)) {
          const childProxy = buildProxy(childValue, path.concat(propertyString), store, trackPath, bailedOutObjects, subProxyCache);
          subProxyCache.set(childValue, childProxy);
        }
        return subProxyCache.get(childValue);
      }

      // Otherwise it's a primitive
      return childValue;
    },

    ownKeys(target) {
      // Bail out on enumeration
      trackPath(store, path);
      bailedOutObjects.add(target);
      return Reflect.ownKeys(target);
    },

    getOwnPropertyDescriptor(target, prop) {
      // Bail out on reflection
      trackPath(store, path);
      bailedOutObjects.add(target);
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  });
}

// ============ Proxy Subscription Utilities =================================== //

export function buildProxySubscriptions(trackedPaths: Set<PathEntry>, createSubscription: SubscriptionBuilder, shouldLog: boolean): void {
  const dedupedPaths = deduplicatePaths(trackedPaths, shouldLog);
  for (const entry of dedupedPaths) {
    createSubscription(
      entry.store,
      entry.invocation ? buildInvocationSelector(entry.path, entry.invocation) : buildPathSelector(entry.path)
    );
  }
}

function buildPathSelector(path: string[]): Selector<unknown, unknown> {
  return state => getValueAtPath(state, path);
}

function buildInvocationSelector(path: string[], invocation: TrackedInvocation): Selector<unknown, unknown> {
  const { method, args } = invocation;
  const parentPath = path.slice(0, -1);

  return state => {
    const parentObj = getValueAtPath(state, parentPath);
    const fn = (parentObj as Record<string, unknown> | undefined)?.[method];
    return typeof fn === 'function' ? fn.apply(parentObj, args) : undefined;
  };
}

// ============ Path Tracking Utilities ======================================== //

/**
 * Global cache for unique store keys. Shared across all derived stores.
 */
const storeKeys = new WeakMap<StoreApi<unknown>, string>();

function getValueAtPath<T>(obj: T, path: string[]): T {
  let current = obj;
  for (const p of path) {
    if (!current || typeof current !== 'object') return current;
    current = (current as Record<string, T>)[p];
  }
  return current;
}

function deduplicatePaths(paths: Set<PathEntry>, shouldLog: boolean): Set<PathEntry> {
  const seenKeys = new Set<string>();
  const deduplicatedPaths = new Set<PathEntry>();

  let argsKey = 0;
  const getArgsKey = () => (argsKey += 1);

  for (const entry of paths) {
    const key = createPathKey(entry, getArgsKey);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedPaths.add(entry);
    }
  }
  return findCommonAncestors(deduplicatedPaths, shouldLog);
}

function createPathKey(entry: PathEntry, getArgsKey: () => number): string {
  const storeKey = getStoreKey(entry.store);
  const pathKey = entry.path.join('.');
  if (!entry.invocation) return `${storeKey}.${pathKey}`;

  // If the invocation has args, treat it as unique, otherwise allow de-duplication
  const invocationKey = entry.invocation.args ? `(${getArgsKey()})` : '()';
  return `${storeKey}.${pathKey}${invocationKey}`;
}

function getStoreKey(store: StoreApi<unknown>): string {
  let key = storeKeys.get(store);
  if (!key) {
    key = generateUniqueId();
    storeKeys.set(store, key);
  }
  return key;
}

const DELIMITER = '\u0000';

/**
 * Takes a set of path entries and removes those that are "descendants" of any shorter path.
 *
 * For instance, if both `['user']` and `['user','profile','email']` appear, only keep `['user']`.
 */
function findCommonAncestors(paths: Set<PathEntry>, shouldLog: boolean): Set<PathEntry> {
  const pathsArray = Array.from(paths);
  // Sort by path length, shortest first
  pathsArray.sort((a, b) => a.path.length - b.path.length);

  const seenAncestors = new Set<string>();
  const finalPaths = new Set<PathEntry>();

  for (const entry of pathsArray) {
    const joined = entry.path.join(DELIMITER);
    // If any ancestor is in seenAncestors, skip
    let skip = false;
    for (let i = 1; i < entry.path.length; i++) {
      const ancestor = entry.path.slice(0, i).join(DELIMITER);
      if (seenAncestors.has(ancestor)) {
        skip = true;
        break;
      }
    }
    if (skip) continue;

    // Keep this path
    finalPaths.add(entry);
    seenAncestors.add(joined);
  }
  if (shouldLog) logTrackedPaths(finalPaths);
  return finalPaths;
}

// ============ Debug Utilities ================================================ //

function logTrackedPaths(paths: Set<PathEntry>): void {
  const count = paths.size;
  console.log(
    `[📡 ${count} Proxy Subscription${count === 1 ? '' : 's'} 📡]:`,
    JSON.stringify(
      Array.from(paths).map(entry => {
        const storeName = getStoreName(entry.store);
        const pathKey = entry.path.join('.');
        if (!entry.invocation) return `$(${storeName}).${pathKey}`;

        const argsCount = entry.invocation.args?.length ?? 0;
        const argsSuffix = argsCount ? `(${argsCount}_arg${argsCount === 1 ? '' : 's'})` : '';
        return `$(${storeName}).${pathKey}${argsSuffix}`;
      }),
      null,
      2
    )
  );
}

function isPersistedStore(store: BaseRainbowStore<unknown>): store is PersistedRainbowStore<unknown> {
  return 'persist' in store;
}

function getStoreName(store: BaseRainbowStore<unknown>): string {
  const name = isPersistedStore(store) ? store.persist.getOptions().name : store.name;
  return name ?? store.name;
}
