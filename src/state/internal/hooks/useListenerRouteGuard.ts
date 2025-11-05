import { RefObject, useMemo } from 'react';
import { useStableValue } from '@/hooks/useStableValue';
import { useRoute } from '@/navigation/Navigation';
import { Route } from '@/navigation/routesNames';
import { ListenHandleTuple, ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { Listener, Selector } from '@/state/internal/types';
import { NavigationState, useNavigationStore } from '@/state/navigation/navigationStore';
import { ListenHandle, useListen } from './useListen';

// ============ Types ========================================================== //

/**
 * Options for the `useListenerRouteGuard` hook.
 */
export type UseListenerRouteGuardOptions = {
  /**
   * Optional additional routes to allow the listener to remain active on.
   * @default undefined
   */
  additionalRoutes?: Route | Route[];
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
  /**
   * The route that must be active for the listener to run.
   * @default useRoute().name
   */
  route?: Route;
};

type RequiredInternalOptions = Required<Omit<UseListenerRouteGuardOptions, 'additionalRoutes' | 'route'>>;

// ============ useListenerRouteGuard ========================================== //

const DEFAULT_OPTIONS = Object.freeze({
  debugMode: false,
  enabled: true,
  fireImmediately: false,
}) satisfies RequiredInternalOptions;

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
 * The same applies to `additionalRoutes`.
 *
 * ---
 * @param listenHandleOrTuple - The `ListenHandle` to suspend/resume, or a tuple of `[SharedValue, ListenHandle]`.
 * @param options - Optional settings including the route and enabling/disabling behavior.
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
 *   { route: Routes.EXPANDED_ASSET_SHEET_V2 }
 * );
 *
 * // -- With `useStoreSharedValue` (returnListenHandle: true):
 * const chartPrice = useListenerRouteGuard(
 *   useStoreSharedValue(
 *     useCandlestickStore,
 *     state => state.getPrice(),
 *     { returnListenHandle: true }
 *   ),
 *   { route: Routes.EXPANDED_ASSET_SHEET_V2 }
 * );
 *
 * // -- With `useStoreSharedValue` (manual destructuring):
 * const [chartPrice, priceListener] = useStoreSharedValue(
 *   useCandlestickStore,
 *   state => state.getPrice(),
 *   { returnListenHandle: true }
 * );
 *
 * useListenerRouteGuard(priceListener, { route: Routes.EXPANDED_ASSET_SHEET_V2 });
 * ```
 */
export function useListenerRouteGuard(listenHandle: RefObject<Readonly<ListenHandle>>, options?: UseListenerRouteGuardOptions): void;

export function useListenerRouteGuard<T>(
  listenHandleTuple: ListenHandleTuple<T>,
  options?: UseListenerRouteGuardOptions
): ReadOnlySharedValue<T>;

export function useListenerRouteGuard<T>(
  listenHandleOrTuple: RefObject<Readonly<ListenHandle>> | ListenHandleTuple<T>,
  { additionalRoutes, debugMode, enabled, fireImmediately, route }: UseListenerRouteGuardOptions = DEFAULT_OPTIONS
): void | ReadOnlySharedValue<T> {
  const currentRoute = useRoute().name;
  const config = useStableValue(() => createRouteGuardConfig(listenHandleOrTuple, route ?? currentRoute, additionalRoutes, debugMode));
  const adjustedOptions = useMemo(() => stripDebugMode({ enabled, fireImmediately }), [enabled, fireImmediately]);

  useListen(useNavigationStore, config.selector, config.suspensionHandler, adjustedOptions);

  if (config.sharedValue) return config.sharedValue;
}

// ============ Utilities ====================================================== //

type RouteGuardConfig<T = unknown> = {
  selector: Selector<NavigationState, boolean>;
  sharedValue: ReadOnlySharedValue<T> | undefined;
  suspensionHandler: Listener<boolean>;
};

function createRouteGuardConfig<T>(
  listenHandleOrTuple: RefObject<Readonly<ListenHandle>> | ListenHandleTuple<T>,
  route: Route,
  additionalRoutes?: Route | Route[],
  debugMode?: boolean
): RouteGuardConfig<T> {
  const isTuple = Array.isArray(listenHandleOrTuple);
  const listenHandle = isTuple ? listenHandleOrTuple[1] : listenHandleOrTuple;
  const sharedValue = isTuple ? listenHandleOrTuple[0] : undefined;

  return {
    selector: createSelector(route, additionalRoutes),
    sharedValue,
    suspensionHandler: createSuspensionHandler(listenHandle, route, debugMode),
  };
}

function createSelector(route: Route, additionalRoutes?: Route | Route[]): Selector<NavigationState, boolean> {
  const hasAdditionalRoutes = additionalRoutes !== undefined;
  if (!hasAdditionalRoutes) return state => state.isRouteActive(route);

  const booleanMap: Partial<Record<Route, boolean>> = { [route]: true };
  if (typeof additionalRoutes === 'string') {
    booleanMap[additionalRoutes] = true;
  } else if (additionalRoutes.length) {
    for (const additionalRoute of additionalRoutes) {
      booleanMap[additionalRoute] = true;
    }
  }

  return state => booleanMap[state.activeRoute] ?? false;
}

function createSuspensionHandler(listenHandle: RefObject<Readonly<ListenHandle>>, route: Route, debugMode?: boolean): Listener<boolean> {
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
}: Pick<UseListenerRouteGuardOptions, 'enabled' | 'fireImmediately'>): RequiredInternalOptions {
  return {
    debugMode: false,
    enabled: enabled ?? DEFAULT_OPTIONS.enabled,
    fireImmediately: fireImmediately ?? DEFAULT_OPTIONS.fireImmediately,
  };
}
