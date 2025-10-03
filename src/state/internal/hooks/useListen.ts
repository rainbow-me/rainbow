import { RefObject, useLayoutEffect } from 'react';
import { useLazyRef as useRef } from '@/hooks/useLazyRef';
import { BaseRainbowStore, EqualityFn, Selector } from '../types';

// ============ Types ========================================================== //

/**
 * Options for resubscribing a listener.
 */
export type ResubscribeOptions = {
  /**
   * Whether to fire the callback immediately when resubscribing.
   * @default false
   */
  fireImmediately?: boolean;
  /**
   * Whether to force a resubscription even if the listener is already active.
   * @default false
   */
  forceResubscribe?: boolean;
};

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
  /** Re-attach the listener. */
  resubscribe: (options?: ResubscribeOptions) => void;
  /** Detach the listener. Safe to call more than once. */
  unsubscribe: () => void;
};

/**
 * Options for the `useListen` hook.
 */
export type UseListenOptions<Selected> = {
  /**
   * Whether to log debug messages to the console.
   * @default false
   */
  debugMode?: boolean;
  /**
   * Whether to enable the listener.
   * @default true
   */
  enabled?: boolean;
  /**
   * Dictates whether `react` should be called on state slice changes.
   * Compares the previous and current selected values.
   * @default Object.is
   */
  equalityFn?: EqualityFn<Selected>;
  /**
   * Whether to fire the callback immediately on mount. Note that if `true`,
   * the `react` callback will be called on mount regardless of whether the
   * selected value has changed.
   * @default false
   */
  fireImmediately?: boolean;
};

type ListenerRef<S, Selected> = {
  selector: Selector<S, Selected>;
  react: (current: Selected, previous: Selected, unsubscribe: () => void) => void;
  options: UseListenOptions<Selected>;
} & ListenHandle;

// ============ useListen ====================================================== //

const DEFAULT_OPTIONS = Object.freeze({
  debugMode: false,
  enabled: true,
  equalityFn: Object.is,
  fireImmediately: false,
}) satisfies Required<UseListenOptions<unknown>>;

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
 * 💡 **Note:** With the exception of `enabled`, changes in `options` are **not reactive**.
 * They take effect only if a resubscription occurs.
 *
 * ---
 * @param store - Zustand store to listen to. Should be a stable reference.
 * @param selector - Selects the slice of the store state to listen to.
 * @param react - Triggered when the selected slice changes. Receives `(current, previous, unsubscribe)`.
 * @param optionsOrEqualityFn - Optional `equalityFn`, `fireImmediately` settings, forwarded to `store.subscribe`.
 *
 * ---
 * @example
 * ```ts
 * useListen(
 *   useCandlestickStore,
 *   state => state.getData(),
 *   (candles, previous, unsubscribe) => {
 *     if (candles?.unsupported) return unsubscribe();
 *     updateTokenPrice(token, getPriceUpdate(candles, previous));
 *     runOnUI(() => chartManager.value?.setCandles(candles))();
 *   }
 * );
 * ```
 */
export function useListen<S, Selected>(
  store: BaseRainbowStore<S>,
  selector: Selector<S, Selected>,
  react: (current: Selected, previous: Selected, unsubscribe: () => void) => void,
  optionsOrEqualityFn: UseListenOptions<Selected> | UseListenOptions<Selected>['equalityFn'] = DEFAULT_OPTIONS
): RefObject<Readonly<ListenHandle>> {
  const listenerRef = useRef<ListenerRef<S, Selected>>(() => createListenerRef(selector, react, optionsOrEqualityFn));
  const enabled = getEnabledOption(optionsOrEqualityFn);

  listenerRef.current.react = react;
  listenerRef.current.selector = selector;
  setOptions(listenerRef, optionsOrEqualityFn);

  useLayoutEffect(() => {
    if (!enabled) return;
    attachListener(store, listenerRef);
    return () => detachListener(listenerRef);
  }, [enabled, store]);

  return listenerRef;
}

// ============ Listener Helpers =============================================== //

const DEFAULT_RESUBSCRIBE_OPTIONS = Object.freeze({
  fireImmediately: false,
  forceResubscribe: false,
}) satisfies Readonly<ResubscribeOptions>;

function attachListener<S, Selected>(
  store: BaseRainbowStore<S>,
  listenerRef: RefObject<ListenerRef<S, Selected>>,
  resubscribeOptions: ResubscribeOptions = DEFAULT_RESUBSCRIBE_OPTIONS
): void {
  if (listenerRef.current.isActive) {
    if (!resubscribeOptions?.forceResubscribe) return;
    listenerRef.current.unsubscribe();
  }

  if (listenerRef.current.options.debugMode) {
    console.log('[📡 useListen 📡] Attaching listener');
  }

  listenerRef.current.isActive = true;
  listenerRef.current.resubscribe = (options: ResubscribeOptions = DEFAULT_RESUBSCRIBE_OPTIONS) =>
    attachListener(store, listenerRef, options);

  const unsubscribe = store.subscribe(
    state => listenerRef.current.selector(state),
    (curr, prev) =>
      listenerRef.current.react(curr, prev, () => {
        unsubscribe();
        listenerRef.current.isActive = false;
      }),
    resubscribeOptions.fireImmediately ? { ...listenerRef.current.options, fireImmediately: true } : listenerRef.current.options
  );

  listenerRef.current.unsubscribe = () => {
    if (!listenerRef.current.isActive) return;
    unsubscribe();
    listenerRef.current.isActive = false;
  };
}

function detachListener<S, Selected>(listenerRef: RefObject<ListenerRef<S, Selected>>): void {
  if (listenerRef.current.options.debugMode) {
    console.log('[🗑️ useListen 🗑️] Detaching listener');
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
  selector: Selector<S, Selected>,
  react: (current: Selected, previous: Selected, unsubscribe: () => void) => void,
  optionsOrEqualityFn: UseListenOptions<Selected> | UseListenOptions<Selected>['equalityFn']
): ListenerRef<S, Selected> {
  return {
    selector,
    react,
    options: buildOptionsObject(optionsOrEqualityFn),
    isActive: false,
    resubscribe: () => {
      return;
    },
    unsubscribe: () => {
      return;
    },
  };
}

// ============ Utilities ====================================================== //

function buildOptionsObject<Selected>(
  optionsOrEqualityFn: UseListenOptions<Selected> | UseListenOptions<Selected>['equalityFn']
): UseListenOptions<Selected> {
  if (typeof optionsOrEqualityFn === 'function') return { equalityFn: optionsOrEqualityFn };
  return optionsOrEqualityFn ?? DEFAULT_OPTIONS;
}

function getEnabledOption<Selected>(optionsOrEqualityFn: UseListenOptions<Selected> | UseListenOptions<Selected>['equalityFn']): boolean {
  if (typeof optionsOrEqualityFn === 'function') return DEFAULT_OPTIONS.enabled;
  return optionsOrEqualityFn?.enabled ?? DEFAULT_OPTIONS.enabled;
}

function setOptions<S, Selected>(
  listenerRef: RefObject<ListenerRef<S, Selected>>,
  optionsOrEqualityFn: UseListenOptions<Selected> | UseListenOptions<Selected>['equalityFn']
): void {
  if (typeof optionsOrEqualityFn === 'function') listenerRef.current.options.equalityFn = optionsOrEqualityFn;
  else if (optionsOrEqualityFn) listenerRef.current.options = optionsOrEqualityFn ?? DEFAULT_OPTIONS;
}
