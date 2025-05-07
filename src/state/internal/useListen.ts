import { MutableRefObject, useLayoutEffect } from 'react';
import { Mutate, StoreApi } from 'zustand';
import { UseBoundStoreWithEqualityFn } from 'zustand/traditional';
import { useRef } from '@/hooks/useLazyRef';

/**
 * Handle returned by `useListen`.
 *
 * The hook cleans itself up, so you normally ignore this handle.
 * Keep it only when you need to pause or resume the listener manually
 * (e.g. suspend heavy work while a long-lived component is off screen).
 */
export type ListenHandle = {
  /** `true` while the listener is attached. */
  isActive: boolean;
  /** Attach (or re-attach) the listener. Pass `true` to force a fresh attach. */
  resubscribe: (force?: boolean) => void;
  /** Detach the listener. Safe to call more than once. */
  unsubscribe: () => void;
};

/**
 * Options for the `useListen` hook.
 */
export type UseListenOptions<Selected> = {
  /**
   * Dictates whether `react` should be called on store state changes.
   * Compares the previous and current selected values.
   * @default Object.is
   */
  equalityFn?: (a: Selected, b: Selected) => boolean;
  /**
   * Whether to log debug messages to the console.
   * @default false
   */
  debugMode?: boolean;
  /**
   * Whether to fire the callback immediately on mount. Note that if `true`,
   * the `react` callback will be called on mount regardless of whether the
   * selected value has changed.
   * @default false
   */
  fireImmediately?: boolean;
};

type ListenerRef<S, Selected> = {
  selector: (state: S) => Selected;
  react: (current: Selected, previous: Selected, unsubscribe: () => void) => void;
  options: UseListenOptions<Selected>;
} & ListenHandle;

const DEFAULT_OPTIONS: UseListenOptions<unknown> = {
  equalityFn: Object.is,
  fireImmediately: false,
};

/**
 * ### `useListen`
 *
 * Subscribes to a slice of a Zustand store and runs a callback whenever that slice changes,
 * **without triggering re-renders**.
 *
 * Useful for forwarding updates to non-React state (e.g. Reanimated shared values), scoped side
 * effects, or deciding yourself if or when a render should happen.
 *
 * The hook attaches the listener and cleans it up automatically. Use the returned `ListenHandle`
 * only when you need to pause or resume the listener manually.
 *
 * ---
 * @param store - Zustand store to listen to. Should be a stable reference.
 * @param selector - Selects the slice of the store state to listen to.
 * @param react - Triggered when the selected slice changes. Receives `(current, previous, unsubscribe)`.
 * @param options - Optional `equalityFn`, `fireImmediately` settings, forwarded to `store.subscribe`.
 *
 * ---
 * 💡 *Note:* Changes in `options` are **not reactive**. They take effect only if a resubscription occurs.
 *
 * ---
 *
 * @example
 * ```ts
 * useListen(
 *   useBrowserStore,
 *   state => state.tabIds[0],
 *   (firstTabId, prevFirstTabId) => {
 *     // Runs only when the first tab ID changes
 *     console.log('First tab ID:', firstTabId);
 *     console.log('Previous first tab ID:', prevFirstTabId);
 *   },
 * );
 * ```
 */
export function useListen<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: (state: S) => Selected,
  react: (current: Selected, previous: Selected, unsubscribe: () => void) => void,
  options: UseListenOptions<Selected> = DEFAULT_OPTIONS
): MutableRefObject<Readonly<ListenHandle>> {
  const listenerRef = useRef<ListenerRef<S, Selected>>(() => createListenerRef(selector, react, options));

  listenerRef.current.react = react;
  listenerRef.current.selector = selector;
  listenerRef.current.options = options;

  useLayoutEffect(() => {
    attachListener(store, listenerRef, false);
    return () => detachListener(listenerRef);
  }, [store]);

  return listenerRef;
}

// ============ Listener Helpers =============================================== //

type SubscribeWithSelector = ['zustand/subscribeWithSelector', never];
type BaseRainbowStore<S> = UseBoundStoreWithEqualityFn<Mutate<StoreApi<S>, [SubscribeWithSelector]>>;

function attachListener<S, Selected>(
  store: BaseRainbowStore<S>,
  listenerRef: MutableRefObject<ListenerRef<S, Selected>>,
  force: boolean
): void {
  if (listenerRef.current.isActive) {
    if (!force) return;
    listenerRef.current.unsubscribe();
  }

  if (listenerRef.current.options.debugMode) {
    console.log('[useListen] Attaching listener', listenerRef.current.selector);
  }

  listenerRef.current.isActive = true;
  listenerRef.current.resubscribe = (force = false) => attachListener(store, listenerRef, force);

  const unsubscribe = store.subscribe(
    state => listenerRef.current.selector(state),
    (curr, prev) =>
      listenerRef.current.react(curr, prev, () => {
        unsubscribe();
        listenerRef.current.isActive = false;
      }),
    listenerRef.current.options
  );

  listenerRef.current.unsubscribe = () => {
    if (!listenerRef.current.isActive) return;
    unsubscribe();
    listenerRef.current.isActive = false;
  };
}

function detachListener<S, Selected>(listenerRef: MutableRefObject<ListenerRef<S, Selected>>): void {
  if (listenerRef.current.options.debugMode) {
    console.log('[useListen] Detaching listener', listenerRef.current.selector);
  }

  listenerRef.current.resubscribe = () => {
    return;
  };
  listenerRef.current.unsubscribe();
  listenerRef.current.unsubscribe = () => {
    return;
  };
  listenerRef.current.isActive = false;
}

function createListenerRef<S, Selected>(
  selector: (state: S) => Selected,
  react: (current: Selected, previous: Selected, unsubscribe: () => void) => void,
  options: UseListenOptions<Selected>
): ListenerRef<S, Selected> {
  return {
    selector,
    react,
    options,
    isActive: false,
    resubscribe: () => {
      return;
    },
    unsubscribe: () => {
      return;
    },
  };
}
