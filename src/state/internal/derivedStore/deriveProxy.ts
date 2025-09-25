import { pluralize } from '@/worklets/strings';
import { BaseRainbowStore, Selector } from '../types';
import { getStoreName } from '../utils/storeUtils';

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

type TrackPathFn = (store: BaseRainbowStore<unknown>, path: string[], isLeaf: boolean, invocation?: TrackedInvocation) => void;

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
  trackPath: TrackPathFn
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

function createTrackingProxy<S>(snapshot: S, store: BaseRainbowStore<unknown>, trackPath: TrackPathFn, path: string[] = []): S {
  // -- If the store state is a primitive or nullish, track as a leaf and return directly
  if (!snapshot || typeof snapshot !== 'object') {
    trackPath(store, path, true);
    return snapshot;
  }

  const bailedOutObjects = new WeakSet<object>();
  const subProxyCache = new WeakMap<object, object>();
  return buildProxy(snapshot, path, store, trackPath, bailedOutObjects, subProxyCache);
}

function buildProxy<T extends object>(
  value: T,
  path: string[],
  store: BaseRainbowStore<unknown>,
  trackPath: TrackPathFn,
  bailedOutObjects: WeakSet<object>,
  subProxyCache: WeakMap<object, object>
): T {
  return new Proxy<T>(value, {
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
      const propKeyString = String(propKey);
      const newPath = path.concat(propKeyString);

      // -- Handle functions
      if (typeof childValue === 'function') {
        const isStoreMethod = Object.prototype.hasOwnProperty.call(target, propKey);

        if (isStoreMethod) {
          // Return a wrapped function that tracks invocation when called. This allows us
          // to build a selector that points to the value *returned* by the method call.
          return function (...args: unknown[]) {
            trackPath(store, newPath, true, { method: propKeyString, args: args.length ? args : undefined });
            return Reflect.apply(childValue, target, args);
          };
        }

        // Built-in prototype function (e.g. .toString), track as final usage (a leaf)
        trackPath(store, path, true);
        return childValue.bind(value);
      }

      // -- Handle non-function property tracking
      // Primitives or nullish values: track as a leaf
      // Objects: track as ancestor usage
      const isObject = !!childValue && typeof childValue === 'object';
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

    has(target, prop) {
      // Track `in` operator usage as a leaf
      trackPath(store, path, true);
      return Reflect.has(target, prop);
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

/**
 * Builds a selector that returns the value at the specified path.
 */
function buildPathSelector(path: string[]): Selector<unknown, unknown> {
  return state => getValueAtPath(state, path);
}

/**
 * Builds a selector that returns the value returned by invoking the
 * specified method on the parent object.
 */
function buildInvocationSelector(path: string[], invocation: TrackedInvocation): Selector<unknown, unknown> {
  const { method, args } = invocation;
  const parentPath = path.slice(0, -1);
  return state => {
    const parentObject = getValueAtPath(state, parentPath);
    const fn = (parentObject as Record<string, unknown> | undefined)?.[method];
    return typeof fn === 'function' ? fn.apply(parentObject, args) : undefined;
  };
}

/**
 * Gets the value at the specified path in an object.
 *
 * `path` is an array of keys used to traverse the object.
 *
 * @example
 * ```ts
 * const obj = { a: { b: { c: 1 } } };
 * getValueAtPath(obj, ['a', 'b', 'c']); // 1
 * ```
 */
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
  trackPath: TrackPathFn;
};

/**
 * A factory that returns a proxy path-tracking object with two methods:
 *  - `buildProxySubscriptions()`: builds subscriptions to the final paths
 *  - `trackPath()`: records usage of a store path
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
        root = createTrieNode();
        storeMap.set(store, root);
      }
      insertPath(root, path, 0, isLeaf, invocation);
    },
  };
}

type TrieNode = {
  children?: Record<string, TrieNode>;
  invocation?: TrackedInvocation;
  isLeaf?: boolean;
};

type RootNode = Record<string, TrieNode>;

/**
 * Creates a prototype-free trie node object.
 */
function createTrieNode<T extends TrieNode | RootNode = TrieNode>(): T {
  return Object.create(null);
}

/**
 * Inserts a path into the trie, creating nodes to represent the path.
 */
function insertPath(node: TrieNode, path: string[], index: number, isLeaf?: boolean, invocation?: TrackedInvocation): void {
  if (index === path.length) {
    if (isLeaf) node.isLeaf = true;
    if (invocation) node.invocation = invocation;
    return;
  }
  if (!node.children) {
    node.children = createTrieNode<RootNode>();
  }
  const segment = path[index];
  let child = node.children?.[segment];
  if (!child) {
    child = createTrieNode();
    node.children[segment] = child;
  }
  insertPath(child, path, index + 1, isLeaf, invocation);
}

/**
 * Determines and collects the final paths to build selectors for.
 */
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
