import React from 'react';
import { RouteParams, UseRouteHook, UseRouteProvider } from '@/navigation/Navigation';
import { Route } from '@/navigation/routesNames';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { setActiveRoute } from '@/state/navigation/navigationStore';
import { shallowEqual } from '@/worklets/comparisons';

export type VirtualNavigationStore<VirtualRoute extends Route> = VirtualNavigationState<VirtualRoute> & VirtualNavigator<VirtualRoute>;

export type VirtualNavigator<VirtualRoute extends Route> = {
  getActiveRoute: () => VirtualRoute;
  getActiveRouteState: () => ActiveRouteState<VirtualRoute>;
  getParams: <R extends VirtualRoute>(route: R) => RouteParams<R> | undefined;
  goBack: () => void;
  isRouteActive: (route: VirtualRoute) => boolean;
  navigate: <R extends VirtualRoute>(route: R, params?: RouteParams<R>) => void;
  resetNavigationState: () => void;
  setParams: <R extends VirtualRoute>(route: R, params: RouteParams<R> | undefined) => void;
};

type VirtualNavigationState<VirtualRoute extends Route> = {
  activeRoute: VirtualRoute;
  history: VirtualRoute[];
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
    keyPrefix?: string;
    onRouteChange?: (route: VirtualRoute) => void;
  };
}) {
  const routeKeyPrefix = options?.keyPrefix ?? 'virtual';
  const initialState: Pick<VirtualNavigationState<VirtualRoute>, 'activeRoute' | 'history' | 'params'> = {
    activeRoute: initialRoute,
    history: [],
    params: {},
  };

  const useNavigationStore = createRainbowStore<VirtualNavigationStore<VirtualRoute>>((set, get) => ({
    activeRoute: initialState.activeRoute,
    history: initialState.history,
    params: initialState.params,

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

    goBack: () => {
      set(state => {
        if (!state.history.length) return state;
        return {
          activeRoute: state.history[state.history.length - 1],
          history: state.history.slice(0, -1),
        };
      });
      setActiveRoute(get().activeRoute);
    },

    isRouteActive: route => route === get().activeRoute,

    navigate: (route, params) => {
      set(state => {
        const didParamsChange = !shallowEqual(params, state.params[route]);

        if (state.activeRoute === route) {
          if (didParamsChange) {
            return { params: { ...state.params, [route]: params } };
          }
          return state;
        }
        return {
          activeRoute: route,
          history: [...state.history, state.activeRoute],
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

  const indexToRoute = routes.reduce<Record<number, VirtualRoute>>((map, route, index) => {
    map[index] = route;
    return map;
  }, {});

  function handlePagerIndexChange(index: number): void {
    const route = indexToRoute[index];
    const { activeRoute, history } = useNavigationStore.getState();

    if (route === activeRoute) {
      options?.onRouteChange?.(route);
      return;
    }

    if (history.length && history[history.length - 1] === route) {
      navigationActions.goBack();
    } else {
      navigationActions.navigate(route);
    }
  }

  function createRouteHook(route: VirtualRoute): UseRouteHook {
    const routeInfo = {
      key: `${routeKeyPrefix}:${String(route)}`,
      name: route,
    };
    return () => routeInfo;
  }

  const RouteProvider = ({ children, name }: { children: React.ReactNode; name: VirtualRoute }) =>
    React.createElement(UseRouteProvider, { value: createRouteHook(name) }, children);

  return {
    Navigation: navigationActions,
    Route: RouteProvider,
    handlePagerIndexChange,
    useNavigationStore,
  };
}
