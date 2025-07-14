import { MutableRefObject, useMemo } from 'react';
import { useStableValue } from '@/hooks/useStableValue';
import { Route } from '@/navigation/routesNames';
import { Listener, Selector } from '@/state/internal/types';
import { NavigationState, useNavigationStore } from '@/state/navigation/navigationStore';
import { ListenHandle, useListen } from './useListen';

// ============ Types ========================================================== //

/**
 * Options for the `useListenerRouteGuard` hook.
 */
export type UseListenerRouteGuardOptions = {
  /**
   * Whether to log debug messages to the console.
   * @default false
   */
  debugMode?: boolean;
  /**
   * Whether to enable the suspension behavior.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to fire the callback immediately on mount. Note that if `true`,
   * the `react` callback will be called on mount regardless of whether the
   * selected value has changed.
   * @default false
   */
  fireImmediately?: boolean;
};

// ============ useListenerRouteGuard ========================================== //

const DEFAULT_OPTIONS = Object.freeze({
  debugMode: false,
  enabled: true,
  fireImmediately: false,
}) satisfies Readonly<Required<UseListenerRouteGuardOptions>>;

/**
 * ### `useListenerRouteGuard`
 *
 * Suspends a `ListenHandle` when a specific route becomes inactive and resumes it when active again.
 *
 * Useful for performance optimization when expensive listeners remain mounted in background screens
 * (e.g., charts in sheets that get covered by navigation).
 *
 * ---
 * 💡 **Note:** The provided `route` is frozen to its initial value. Subsequent changes have no effect.
 *
 * ---
 * @param listenHandle - The `ListenHandle` to suspend/resume.
 * @param route - The route that must be active for the listener to run.
 * @param options - Optional settings for enabling/disabling the behavior.
 *
 * ---
 * @example
 * ```ts
 * // -- With `useListen`:
 * useListenerRouteGuard(
 *   useListen(
 *     useCandlestickStore,
 *     state => state.getPrice(),
 *     { fireImmediately: true }
 *   ),
 *   Routes.EXPANDED_ASSET_SHEET_V2
 * );
 *
 * // -- With `useStoreSharedValue`:
 * const [chartPrice, priceListener] = useStoreSharedValue(
 *   useCandlestickStore,
 *   state => state.getPrice(),
 *   { returnListenHandle: true }
 * );
 *
 * useListenerRouteGuard(priceListener, Routes.EXPANDED_ASSET_SHEET_V2);
 * ```
 */
export function useListenerRouteGuard(
  listenHandle: MutableRefObject<Readonly<ListenHandle>>,
  route: Route,
  { debugMode, enabled, fireImmediately }: UseListenerRouteGuardOptions = DEFAULT_OPTIONS
): void {
  const handlers = useStableValue(() => createHandlers(listenHandle, route, debugMode));
  const adjustedOptions = useMemo(() => stripDebugMode({ enabled, fireImmediately }), [enabled, fireImmediately]);
  useListen(useNavigationStore, handlers.selector, handlers.suspensionHandler, adjustedOptions);
}

// ============ Utilities ====================================================== //

type UseListenHandlers = {
  selector: Selector<NavigationState, boolean>;
  suspensionHandler: Listener<boolean>;
};

function createHandlers(listenHandle: MutableRefObject<Readonly<ListenHandle>>, route: Route, debugMode?: boolean): UseListenHandlers {
  return {
    selector: state => state.isRouteActive(route),
    suspensionHandler: createSuspensionHandler(listenHandle, route, debugMode),
  };
}

function createSuspensionHandler(
  listenHandle: MutableRefObject<Readonly<ListenHandle>>,
  route: Route,
  debugMode?: boolean
): Listener<boolean> {
  return isActive => {
    if (isActive) {
      if (debugMode) console.log(`[✅ useListenerRouteGuard ✅] Resuming: '${route}' became active`);
      listenHandle.current.resubscribe({ fireImmediately: true });
    } else {
      if (debugMode) console.log(`[🤺 useListenerRouteGuard 🤺] Suspending: '${route}' became inactive`);
      listenHandle.current.unsubscribe();
    }
  };
}

function stripDebugMode({
  enabled,
  fireImmediately,
}: Pick<UseListenerRouteGuardOptions, 'enabled' | 'fireImmediately'>): Required<UseListenerRouteGuardOptions> {
  return {
    debugMode: false,
    enabled: enabled ?? DEFAULT_OPTIONS.enabled,
    fireImmediately: fireImmediately ?? DEFAULT_OPTIONS.fireImmediately,
  };
}
