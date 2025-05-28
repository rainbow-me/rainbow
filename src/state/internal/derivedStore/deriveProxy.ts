import { pluralize } from '@/worklets/strings';
import { BaseRainbowStore, PersistedRainbowStore, Selector } from '../types';

// ============ Types ========================================================== //

type PathEntry = {
  path: string[];
  store: BaseRainbowStore<unknown>;
  invocation?: TrackedInvocation;
  isLeaf: boolean;
};

type TrackedInvocation = {
  args: unknown[] | undefined;
  method: string;
};

type PathTracker = (store: BaseRainbowStore<unknown>, path: string[], isLeaf: boolean, invocation?: TrackedInvocation) => void;

type SubscriptionBuilder = (store: BaseRainbowStore<unknown>, selector: Selector<unknown, unknown>) => void;

// ============ Proxy Creator ================================================== //

/**
 * Gets or creates a lightweight tracking proxy that records path access and store
 * method invocations via proxy traps. Used to auto-generate selectors that point
 * to either the accessed path or the value returned by an invoked store method.
 */
export function getOrCreateProxy<S>(
  store: BaseRainbowStore<S>,
  rootProxyCache: WeakMap<BaseRainbowStore<unknown>, unknown>,
  trackPath: PathTracker
): S {
  // The WeakMap can't handle generics, so here we re-apply the correct type
  const proxyByStore = rootProxyCache.get(store) as S | undefined;

  if (!proxyByStore) {
    const snapshot = store.getState();
    const newProxy = createTrackingProxy(snapshot, store, trackPath);
    rootProxyCache.set(store, newProxy);
    return newProxy;
  }
  return proxyByStore;
}

function createTrackingProxy<S>(snapshot: S, store: BaseRainbowStore<unknown>, trackPath: PathTracker, path: string[] = []): S {
  const bailedOutObjects = new WeakSet<object>();
  const subProxyCache = new WeakMap<object, object>();
  return buildProxy(snapshot, path, store, trackPath, bailedOutObjects, subProxyCache);
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
      // -- If we've already bailed out on this object, no further sub-proxies
      if (bailedOutObjects.has(target)) {
        return Reflect.get(target, propKey, receiver);
      }

      // -- If it's a symbol or __proto__, handle normally (and bail out on iteration)
      if (propKey === '__proto__' || typeof propKey === 'symbol') {
        // If enumerating or iterating, treat that as a leaf usage on the parent
        if (propKey === Symbol.iterator) {
          trackPath(store, path, true);
          bailedOutObjects.add(target);
        }
        return Reflect.get(target, propKey, receiver);
      }

      // -- Get the property value
      const childValue = Reflect.get(target, propKey, receiver);
      const newPath = path.concat(String(propKey));

      // -- Handle functions
      if (typeof childValue === 'function') {
        const isStoreMethod = Object.prototype.hasOwnProperty.call(target, propKey);

        if (isStoreMethod) {
          // Return a wrapped function that tracks invocation when called. This allows us
          // to build a selector that points to the value *returned* by the method call.
          return function (...args: unknown[]) {
            trackPath(store, newPath, true, { method: String(propKey), args: args.length ? args : undefined });
            return Reflect.apply(childValue, target, args);
          };
        }

        // Built-in prototype function (e.g. .toString), track as final usage (a leaf)
        trackPath(store, newPath, true);
        return childValue.bind(value);
      }

      // -- Handle non-function property tracking
      // Primitives or nullish values: track as a leaf
      // Objects: track as ancestor usage
      const isObject = childValue && typeof childValue === 'object';
      trackPath(store, newPath, !isObject);

      // -- For objects, return a sub-proxy
      if (isObject) {
        if (!subProxyCache.has(childValue)) {
          subProxyCache.set(childValue, buildProxy(childValue, newPath, store, trackPath, bailedOutObjects, subProxyCache));
        }
        return subProxyCache.get(childValue);
      }

      // -- Otherwise it's a primitive or nullish, so return directly
      return childValue;
    },

    getOwnPropertyDescriptor(target, prop) {
      // Bail out on reflection and track as a leaf
      trackPath(store, path, true);
      bailedOutObjects.add(target);
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },

    ownKeys(target) {
      // Bail out on enumeration and track as a leaf
      trackPath(store, path, true);
      bailedOutObjects.add(target);
      return Reflect.ownKeys(target);
    },
  });
}

// ============ Proxy Subscription Utilities =================================== //

function buildProxySubscriptions(finalPaths: Set<PathEntry>, createSubscription: SubscriptionBuilder, shouldLog: boolean): void {
  for (const entry of finalPaths) {
    createSubscription(
      entry.store,
      entry.invocation ? buildInvocationSelector(entry.path, entry.invocation) : buildPathSelector(entry.path)
    );
  }
  if (shouldLog) logTrackedPaths(finalPaths);
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

function getValueAtPath<T>(obj: T, path: string[]): T {
  let current = obj;
  for (const p of path) {
    if (!current || typeof current !== 'object') return current;
    current = (current as Record<string, T>)[p];
  }
  return current;
}

// ============ Proxy Path Tracking ============================================ //

export type PathFinder = {
  buildProxySubscriptions(createSubscription: SubscriptionBuilder, shouldLog: boolean): void;
  trackPath: PathTracker;
};

type TrieNode = {
  children?: Record<string, TrieNode>;
  isLeaf?: boolean;
  invocation?: TrackedInvocation;
};

/**
 * A factory returning a proxy path-tracking object with two methods:
 *  - `buildProxySubscriptions()`: build subscriptions for the final paths
 *  - `trackPath()`: record usage of a store path
 */
export function createPathFinder(): PathFinder {
  // Each store maps to its trie root node
  const storeMap = new Map<BaseRainbowStore<unknown>, TrieNode>();

  return {
    buildProxySubscriptions(createSubscription: SubscriptionBuilder, shouldLog: boolean) {
      const results = new Set<PathEntry>();
      for (const [store, rootNode] of storeMap) {
        collectMinimalPaths(rootNode, store, [], true, results);
      }
      buildProxySubscriptions(results, createSubscription, shouldLog);
    },

    trackPath(store, path, isLeaf, invocation) {
      let root = storeMap.get(store);
      if (!root) {
        const newRoot: TrieNode = Object.create(null);
        root = newRoot;
        storeMap.set(store, root);
      }
      insertPath(root, path, 0, isLeaf, invocation);
    },
  };
}

function insertPath(node: TrieNode, path: string[], idx: number, isLeaf?: boolean, invocation?: TrackedInvocation): void {
  if (idx === path.length) {
    if (isLeaf) node.isLeaf = true;
    if (invocation) node.invocation = invocation;
    return;
  }
  if (!node.children) {
    // Avoid any prototype overhead
    node.children = Object.create(null);
  }
  const segment = path[idx];
  let child = node.children?.[segment];
  if (!child) {
    const newChild: TrieNode = Object.create(null);
    child = newChild;
    if (node.children) node.children[segment] = newChild;
  }
  insertPath(child, path, idx + 1, isLeaf, invocation);
}

function collectMinimalPaths(
  node: TrieNode,
  store: BaseRainbowStore<unknown>,
  path: string[],
  isRoot: boolean,
  results: Set<PathEntry>
): void {
  const children = node.children;
  if (!children) {
    // Leaf node
    results.add({ store, path, invocation: node.invocation, isLeaf: node.isLeaf ?? false });
    return;
  }
  const childKeys = Object.keys(children);
  const childCount = childKeys.length;

  // 1) No children => leaf
  if (childCount === 0) {
    results.add({ store, path, invocation: node.invocation, isLeaf: node.isLeaf ?? false });
    return;
  }

  // 2) Is a leaf (or non-root & has multiple children) => subscribe here
  if (node.isLeaf || (!isRoot && childCount > 1)) {
    results.add({ store, path, invocation: node.invocation, isLeaf: node.isLeaf ?? false });
    // Only recurse into children that have an invocation
    for (const key of childKeys) {
      const child = children[key];
      if (child.invocation) collectMinimalPaths(child, store, [...path, key], false, results);
    }
    return;
  }

  // 3) Root with multiple children but not a leaf => skip root, recurse each child
  if (isRoot && childCount > 1 && !node.isLeaf) {
    for (const key of childKeys) {
      collectMinimalPaths(children[key], store, [...path, key], false, results);
    }
    return;
  }

  // 4) Exactly one child, not a leaf => merge downward
  if (childCount === 1) {
    const onlyKey = childKeys[0];
    collectMinimalPaths(children[onlyKey], store, [...path, onlyKey], false, results);
    return;
  }

  // If no prior conditions met, subscribe here
  results.add({ store, path, invocation: node.invocation, isLeaf: node.isLeaf ?? false });
}

// ============ Debug Utilities ================================================ //

function logTrackedPaths(paths: Set<PathEntry>): void {
  const count = paths.size;
  console.log(
    `[📡 ${count} ${pluralize('Proxy Subscription', count)} 📡]:`,
    JSON.stringify(
      Array.from(paths).map(entry => {
        const storeName = getStoreName(entry.store);
        const pathKey = entry.path.join('.');
        if (!entry.invocation) return pathKey ? `$(${storeName}).${pathKey}` : `$(${storeName})`;

        const argsCount = entry.invocation.args?.length ?? 0;
        const argsSuffix = argsCount ? `(${argsCount}_${pluralize('arg', argsCount)})` : '()';
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
