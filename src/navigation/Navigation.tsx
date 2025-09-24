import {
  CommonActions,
  NavigationAction,
  NavigationContainerRef,
  NavigationState,
  Route as ReactNavigationRoute,
  RouteProp,
  StackActions,
  useNavigation as useReactNavigation,
  useRoute as useReactNavigationRoute,
} from '@react-navigation/native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { createContext, useContext, useMemo } from 'react';
import { useCallbackOne } from 'use-memo-one';
import { IS_DEV } from '@/env';
import { setActiveRoute } from '@/state/navigation/navigationStore';
import { prefetchRegistry } from './prefetchRegistry';
import Routes, { NATIVE_ROUTES, Route } from './routesNames';
import { RootStackParamList, RoutesWithOptionalParams } from './types';
import { VIRTUAL_NAVIGATORS } from './virtualNavigators';

// ============ Navigation Ref ================================================= //

let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

// ============ Public Types =================================================== //

export type { Route };

export type RouteParams<RouteName extends Route> = RootStackParamList[RouteName];
export type UseRouteHook<RouteName extends Route = Route> = () => RouteProp<RootStackParamList, RouteName>;

export type NavigateArgs<RouteName extends Route> = RouteName extends RoutesWithOptionalParams
  ? [screen: RouteName, params?: RootStackParamList[RouteName]]
  : [screen: RouteName, params: RootStackParamList[RouteName]];

// ============ Internal Types ================================================= //

/**
 * Defines the type of `action` in `navigationRef.dispatch(action)`.
 */
type DispatchActionParam = NavigationAction | ((state: NavigationState) => NavigationAction);

/**
 * Extended navigation options with custom sheet properties.
 */
type ExtendedStackNavigationOptions = Partial<StackNavigationOptions> & {
  limitActiveModals?: boolean;
  longFormHeight?: number;
  shortFormHeight?: number;
  onWillDismiss?: () => void;
};

// ============ Hooks ========================================================== //

export function useNavigation<RouteName extends Route>() {
  const navigation = useReactNavigation<StackNavigationProp<RootStackParamList, RouteName>>();

  const goBack = useCallbackOne(() => {
    navigation.goBack();
    const newActiveRoute = getActiveRouteName();
    if (newActiveRoute) setActiveRoute(newActiveRoute);
  }, [navigation.goBack]);

  const setOptions = useCallbackOne((params: ExtendedStackNavigationOptions) => navigation.setOptions(params), [navigation.setOptions]);

  return useMemo(
    () => ({
      ...navigation,
      goBack,
      navigate,
      replace,
      setOptions,
      setParams,
    }),
    [navigation, goBack, setOptions]
  );
}

// ============ useRoute Context =============================================== //

const UseRouteContext = createContext<UseRouteHook>(useDefaultUseRoute);
export const UseRouteProvider = UseRouteContext.Provider;

export function useRoute(): RouteProp<RootStackParamList, Route> {
  const useRouteHook = useContext(UseRouteContext);
  return useRouteHook();
}

function useDefaultUseRoute(): RouteProp<RootStackParamList, Route> {
  return useReactNavigationRoute<RouteProp<RootStackParamList, Route>>();
}

// ============ Core Navigation Functions ====================================== //

/**
 * Navigates back to the previous screen.
 */
export function goBack(): void {
  if (navigationRef?.isReady()) {
    navigationRef.goBack();
    const newActiveRoute = getActiveRouteName();
    if (newActiveRoute) setActiveRoute(newActiveRoute);
  }
}

/**
 * Navigates to a screen from anywhere in the app.
 */
export function navigate<RouteName extends Route>(...args: NavigateArgs<RouteName>): void {
  const [routeName, params] = args;
  dispatchAction(CommonActions.navigate({ name: routeName, params }), routeName, params);
}

/**
 * Replaces the current screen in the stack.
 */
export function replace<RouteName extends Route>(...args: NavigateArgs<RouteName>): void {
  const [routeName, params] = args;
  dispatchAction(StackActions.replace(routeName, params), routeName, params);
}

// ============ Active Route Helpers =========================================== //

/**
 * Returns the current active route.
 */
export function getActiveRoute<RouteName extends Route>(): ReactNavigationRoute<
  RouteName | string,
  RootStackParamList[RouteName] | object | undefined
> | null {
  const route = navigationRef?.getCurrentRoute() ?? null;
  if (!route) return null;
  assertRoute(route.name);
  return VIRTUAL_NAVIGATORS[route.name]?.getActiveRouteState() ?? route;
}

/**
 * Returns the name of the current active route.
 */
export function getActiveRouteName(): Route | null {
  const route = getActiveRoute();
  if (!route) return null;
  assertRoute(route.name);
  return route.name;
}

// ============ Utility Functions ============================================== //

/**
 * Returns a reference to the top-level `navigationRef`.
 */
export function getNavigationRef(): NavigationContainerRef<RootStackParamList> | null {
  return navigationRef;
}

/**
 * Gets the current navigation state.
 */
export function getState(): NavigationState | null {
  return navigationRef?.getState() ?? null;
}

/**
 * Sets parameters for the current route.
 */
export function setParams<RouteName extends Route>(params: RootStackParamList[RouteName]): void {
  if (navigationRef?.isReady()) {
    navigationRef.setParams(params);
  }
}

/**
 * Sets the top-level `navigationRef`.
 */
export function setNavigationRef(ref: NavigationContainerRef<RootStackParamList>): void {
  navigationRef = ref;
}

// ============ Internal Helpers =============================================== //

const ROUTES_SET = IS_DEV ? new Set<Route>(Object.values(Routes)) : undefined;

function assertRoute(route: Route | string): asserts route is Route {
  if (!ROUTES_SET) return;
  if (!ROUTES_SET.has(route as Route)) {
    throw new Error(`[assertRoute] Invalid route: ${route}`);
  }
}

/**
 * Internal helper for dispatching navigation actions.
 * Handles sheet coordination.
 */
function dispatchAction<RouteName extends Route>(
  action: DispatchActionParam,
  routeName: RouteName,
  params: RootStackParamList[RouteName]
): void {
  function dispatch(): void {
    if (navigationRef?.isReady()) {
      cancelPendingRouteChange();
      prefetchRegistry[routeName]?.(params);
      setActiveRoute(routeName);
      navigationRef.dispatch(action);
    }
  }

  if (!NATIVE_ROUTES.has(routeName)) {
    dispatch();
    return;
  }

  const wasBlocked = blocked;
  block();
  if (wasBlocked) return;

  runAfterSheetDismissal(dispatch);
}

// ============ Sheet Handling ================================================= //

type SheetCoordinator = {
  isClosing: boolean;
  pendingActions: (() => void)[];
};

const sheetCoordinator: SheetCoordinator = {
  isClosing: false,
  pendingActions: [],
};

let blocked = false;
let timeout: ReturnType<typeof setTimeout> | null = null;
let pendingRouteChangeId = 0;

/**
 * Called when a sheet dismissal is triggered.
 */
export function onWillPop(): void {
  sheetCoordinator.isClosing = true;
}

/**
 * Called after a sheet has finished closing.
 * Executes any pending actions scheduled during dismissal.
 */
export function onDidPop(): void {
  sheetCoordinator.isClosing = false;
  if (sheetCoordinator.pendingActions.length) {
    setImmediate(() => {
      for (const action of sheetCoordinator.pendingActions) action();
      sheetCoordinator.pendingActions = [];
    });
  }
  scheduleRouteChange();
}

/**
 * Temporarily blocks rapid navigation actions.
 */
function block(): void {
  blocked = true;
  if (timeout !== null) {
    clearTimeout(timeout);
    timeout = null;
  }
  timeout = setTimeout(() => (blocked = false), 200);
}

/**
 * Schedules an action to be executed after sheet dismissal,
 * or runs it immediately if no sheet is currently closing.
 */
function runAfterSheetDismissal(action: () => void): void {
  if (sheetCoordinator.isClosing) {
    sheetCoordinator.pendingActions.push(action);
  } else {
    action();
  }
}

function cancelPendingRouteChange(): void {
  pendingRouteChangeId += 1;
}

function scheduleRouteChange(): void {
  pendingRouteChangeId += 1;
  const requestId = pendingRouteChangeId;
  queueMicrotask(() => {
    if (requestId !== pendingRouteChangeId) return;
    const newActiveRoute = getActiveRouteName();
    if (newActiveRoute) setActiveRoute(newActiveRoute);
  });
}

// ============ Navigation Service ============================================= //

export default {
  getActiveRoute,
  getActiveRouteName,
  getState,
  goBack,
  handleAction: navigate,
  replace,
  setParams,
  setNavigationRef,
} as const;
