import { makeMutable, SharedValue } from 'react-native-reanimated';
import Routes, { Route } from '@/navigation/routesNames';
import { POINTS_ROUTES } from '@/screens/points/PointsScreen';
import { createRainbowStore } from '../internal/createRainbowStore';

export type NavigationState = {
  activeRoute: Route;
  activeSwipeRoute: SwipeRoute;
  animatedActiveRoute: SharedValue<Route>;
  animatedActiveSwipeRoute: SharedValue<SwipeRoute>;
  isWalletScreenMounted: boolean;
  isRouteActive: (route: Route) => boolean;
  setActiveRoute: (route: Route) => void;
};

const SWIPE_ROUTES = [
  Routes.WALLET_SCREEN,
  Routes.DISCOVER_SCREEN,
  Routes.DAPP_BROWSER_SCREEN,
  Routes.PROFILE_SCREEN,
  Routes.POINTS_SCREEN,
  POINTS_ROUTES['CLAIM_CONTENT'],
  POINTS_ROUTES['REFERRAL_CONTENT'],
] as const;

type SwipeRoute = (typeof SWIPE_ROUTES)[number];

const SWIPE_ROUTES_SET = new Set<SwipeRoute>(SWIPE_ROUTES);

export function isSwipeRoute(route: Route | SwipeRoute): route is SwipeRoute {
  return SWIPE_ROUTES_SET.has(route as SwipeRoute);
}

export const useNavigationStore = createRainbowStore<NavigationState>((set, get) => ({
  activeRoute: Routes.WALLET_SCREEN,
  activeSwipeRoute: Routes.WALLET_SCREEN,
  animatedActiveRoute: makeMutable<Route>(Routes.WALLET_SCREEN),
  animatedActiveSwipeRoute: makeMutable<SwipeRoute>(Routes.WALLET_SCREEN),
  isWalletScreenMounted: false,

  isRouteActive: route => route === get().activeRoute,

  setActiveRoute: route =>
    set(state => {
      if (route === state.activeRoute) return state;
      const onSwipeRoute = isSwipeRoute(route);

      state.animatedActiveRoute.value = route;
      if (onSwipeRoute) state.animatedActiveSwipeRoute.value = route;

      return {
        ...state,
        activeRoute: route,
        activeSwipeRoute: onSwipeRoute ? route : state.activeSwipeRoute,
      };
    }),
}));

export const { isRouteActive, setActiveRoute } = useNavigationStore.getState();
