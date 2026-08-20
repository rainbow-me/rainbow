import React from 'react';

import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { UseRouteProvider, type RouteParams, type UseRouteHook } from '@/navigation/Navigation';
import { type PagerNavigation, type PagerNavigationState } from '@/navigation/pagerNavigation';
import { type Route } from '@/navigation/routesNames';
import { setActiveRoute } from '@/state/navigation/navigationStore';
import { shallowEqual } from '@/worklets/comparisons';

export type VirtualNavigationStore<VirtualRoute extends Route> = VirtualNavigationState<VirtualRoute> & VirtualNavigator<VirtualRoute>;

export type VirtualNavigator<VirtualRoute extends Route> = {
  getActiveRoute: () => VirtualRoute;
  getActiveRouteState: () => ActiveRouteState<VirtualRoute>;
  getParams: <R extends VirtualRoute>(route: R) => RouteParams<R> | undefined;
  /**
   * Returns to the previous route, or starts a new path at the fallback when history is empty.
   */
  goBack: <R extends VirtualRoute>(fallbackRoute?: R, fallbackParams?: RouteParams<R>) => void;
  goForward: () => void;
  isRouteActive: (route: VirtualRoute) => boolean;
  navigate: <R extends VirtualRoute>(route: R, params?: RouteParams<R>) => void;
  resetNavigationState: () => void;
  setParams: <R extends VirtualRoute>(route: R, params: RouteParams<R> | undefined) => void;
};

type VirtualNavigationState<VirtualRoute extends Route> = {
  activeRoute: VirtualRoute;
  future: readonly VirtualRoute[];
  history: readonly VirtualRoute[];
  params: { [R in VirtualRoute]?: RouteParams<R> };
};

type ActiveRouteState<VirtualRoute extends Route> = {
  key: string;
  name: VirtualRoute;
  params: RouteParams<VirtualRoute> | undefined;
};

export function createVirtualNavigator<VirtualRoute extends Route>({
  initialRoute,
  routes,
  options,
}: {
  initialRoute: VirtualRoute;
  routes: readonly VirtualRoute[];
  options?: {
    /** Resolves the route at which each new pager binding enters. */
    getEntryRoute?: () => VirtualRoute;
    /** When the group changes between two routes, `navigate` clears history instead of appending to it. */
    getRouteGroup?: (route: VirtualRoute) => string;
    keyPrefix?: string;
  };
}) {
  const routeKeyPrefix = options?.keyPrefix ?? 'virtual';
  const initialState: VirtualNavigationState<VirtualRoute> = {
    activeRoute: initialRoute,
    future: [],
    history: [],
    params: {},
  };

  const useNavigationStore = createBaseStore<VirtualNavigationStore<VirtualRoute>>((set, get) => ({
    ...initialState,

    getActiveRoute: () => get().activeRoute,

    getActiveRouteState: () => {
      const { activeRoute, params } = get();
      return {
        key: `${routeKeyPrefix}:${activeRoute}`,
        name: activeRoute,
        params: params[activeRoute],
      };
    },

    getParams: route => get().params[route],

    goBack: (...fallback) => {
      const didSpecifyFallbackParams = fallback.length > 1;
      const [fallbackRoute, fallbackParams] = fallback;

      set(state => {
        if (state.history.length) {
          return {
            activeRoute: state.history[state.history.length - 1],
            future: [...state.future, state.activeRoute],
            history: state.history.slice(0, -1),
          };
        }

        if (fallbackRoute === undefined) return state;

        const didParamsChange = didSpecifyFallbackParams && !shallowEqual(fallbackParams, state.params[fallbackRoute]);
        if (state.activeRoute === fallbackRoute && !state.future.length && !didParamsChange) return state;

        return {
          activeRoute: fallbackRoute,
          future: [],
          history: [],
          params: didParamsChange ? { ...state.params, [fallbackRoute]: fallbackParams } : state.params,
        };
      });
      setActiveRoute(get().activeRoute);
    },

    goForward: () => {
      set(state => {
        if (!state.future.length) return state;
        return {
          activeRoute: state.future[state.future.length - 1],
          future: state.future.slice(0, -1),
          history: [...state.history, state.activeRoute],
        };
      });
      setActiveRoute(get().activeRoute);
    },

    isRouteActive: route => route === get().activeRoute,

    navigate: (...args) => {
      const didSpecifyParams = args.length > 1;
      const [route, params] = args;

      set(state => {
        const didParamsChange = didSpecifyParams && !shallowEqual(params, state.params[route]);
        if (state.activeRoute === route) {
          if (didParamsChange) return { params: { ...state.params, [route]: params } };
          return state;
        }
        const getRouteGroup = options?.getRouteGroup;
        const crossesGroupBoundary = getRouteGroup != null && getRouteGroup(route) !== getRouteGroup(state.activeRoute);
        return {
          activeRoute: route,
          future: [],
          history: crossesGroupBoundary ? [] : [...state.history, state.activeRoute],
          params: didParamsChange ? { ...state.params, [route]: params } : state.params,
        };
      });
      setActiveRoute(route);
    },

    resetNavigationState: () => set(initialState),

    setParams: (route, params) =>
      set(state => {
        if (shallowEqual(state.params[route], params)) return state;
        return {
          params: { ...state.params, [route]: params },
        };
      }),
  }));

  const navigationActions = createStoreActions(useNavigationStore);

  function createRouteHook(route: VirtualRoute): UseRouteHook {
    const routeInfo = {
      key: `${routeKeyPrefix}:${String(route)}`,
      name: route,
    };
    return () => routeInfo;
  }

  const routeHooks = new Map<VirtualRoute, UseRouteHook | undefined>();
  routes.forEach(route => routeHooks.set(route, undefined));

  function getRouteHook(route: VirtualRoute): UseRouteHook | undefined {
    if (!routeHooks.has(route)) return;
    let hook = routeHooks.get(route);
    if (!hook) routeHooks.set(route, (hook = createRouteHook(route)));
    return hook;
  }

  const RouteProvider = ({ children, name }: { children: React.ReactNode; name: VirtualRoute }) => {
    const useRoute = getRouteHook(name);
    if (!useRoute) throw new Error(`Virtual route "${name}" is not registered.`);
    return React.createElement(UseRouteProvider, { value: useRoute }, children);
  };

  function selectPagerState({ activeRoute, future, history }: VirtualNavigationState<VirtualRoute>): PagerNavigationState<VirtualRoute> {
    return {
      back: history.at(-1),
      forward: future.at(-1),
      page: activeRoute,
    };
  }

  const pagerNavigation: PagerNavigation<VirtualRoute> = {
    beginPath: () => {
      const activeRoute = options?.getEntryRoute?.() ?? useNavigationStore.getState().activeRoute;
      useNavigationStore.setState(state => {
        if (state.activeRoute === activeRoute && !state.history.length && !state.future.length) return state;
        return { activeRoute, future: [], history: [] };
      });
      return selectPagerState(useNavigationStore.getState());
    },
    getState: () => selectPagerState(useNavigationStore.getState()),
    goBack: navigationActions.goBack,
    goForward: navigationActions.goForward,
    navigate: page => {
      if (routeHooks.has(page)) navigationActions.navigate(page);
    },
    subscribe: listener => useNavigationStore.subscribe(selectPagerState, listener, { equalityFn: shallowEqual }),
  };

  return {
    Navigation: navigationActions,
    Pager: pagerNavigation,
    Route: RouteProvider,
    useNavigationStore,
  };
}
