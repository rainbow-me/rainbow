import { makeMutable, type SharedValue } from 'react-native-reanimated';

import Routes, { type Route } from '@/navigation/routesNames';
import { VIRTUAL_NAVIGATORS } from '@/navigation/virtualNavigators';

import { createRainbowStore } from '../internal/createRainbowStore';

export type NavigationState = {
  activeRoute: Route;
  activeSwipeRoute: SwipeRoute;
  animatedActiveRoute: SharedValue<Route>;
  animatedActiveSwipeRoute: SharedValue<SwipeRoute>;
  isWalletScreenMounted: boolean;
  isRouteActive: (route: Route) => boolean;
  isSwipeRouteActive: (route: SwipeRoute) => boolean;
  setActiveRoute: (route: Route) => void;
};

const SWIPE_ROUTES = [
  Routes.WALLET_SCREEN,
  Routes.DISCOVER_SCREEN,
  Routes.DAPP_BROWSER_SCREEN,
  Routes.KING_OF_THE_HILL,
  Routes.PROFILE_SCREEN,
  Routes.RNBW_MEMBERSHIP_SCREEN,
  Routes.RNBW_REWARDS_SCREEN,
] as const;

/** Root screen route controlled by the swipe navigator. */
export type SwipeRoute = (typeof SWIPE_ROUTES)[number];

const SWIPE_ROUTES_SET = new Set<Route>(SWIPE_ROUTES);

export const useNavigationStore = createRainbowStore<NavigationState>((set, get) => ({
  activeRoute: Routes.WALLET_SCREEN,
  activeSwipeRoute: Routes.WALLET_SCREEN,
  animatedActiveRoute: makeMutable<Route>(Routes.WALLET_SCREEN),
  animatedActiveSwipeRoute: makeMutable<SwipeRoute>(Routes.WALLET_SCREEN),
  isWalletScreenMounted: false,

  isRouteActive: route => route === get().activeRoute,

  isSwipeRouteActive: route => route === get().activeSwipeRoute,

  setActiveRoute: route =>
    set(state => {
      const newActiveRoute = VIRTUAL_NAVIGATORS[route]?.getActiveRoute() ?? route;

      if (newActiveRoute === state.activeRoute) return state;
      const onSwipeRoute = isSwipeRoute(newActiveRoute);

      state.animatedActiveRoute.value = newActiveRoute;
      if (onSwipeRoute) state.animatedActiveSwipeRoute.value = newActiveRoute;

      return {
        activeRoute: newActiveRoute,
        activeSwipeRoute: onSwipeRoute ? newActiveRoute : state.activeSwipeRoute,
      };
    }),
}));

/**
 * Returns whether a route belongs to the swipe navigator.
 */
export function isSwipeRoute(route: Route): route is SwipeRoute {
  return SWIPE_ROUTES_SET.has(route);
}

export const { isRouteActive, isSwipeRouteActive, setActiveRoute } = useNavigationStore.getState();
