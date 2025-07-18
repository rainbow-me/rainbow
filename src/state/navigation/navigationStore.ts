import { makeMutable, SharedValue } from 'react-native-reanimated';
import Routes from '@/navigation/routesNames';
import { POINTS_ROUTES } from '@/screens/points/PointsScreen';
import { createRainbowStore } from '../internal/createRainbowStore';

interface NavigationStore {
  activeRoute: string;
  activeSwipeRoute: SwipeRoute;
  animatedActiveRoute: SharedValue<string>;
  animatedActiveSwipeRoute: SharedValue<SwipeRoute>;
  isWalletScreenMounted: boolean;
  isRouteActive: (route: string) => boolean;
  setActiveRoute: (route: string) => void;
}

const SWIPE_ROUTES = [
  Routes.WALLET_SCREEN,
  Routes.DISCOVER_SCREEN,
  Routes.DAPP_BROWSER_SCREEN,
  Routes.PROFILE_SCREEN,
  Routes.POINTS_SCREEN,
  Routes.KING_OF_THE_HILL,
  POINTS_ROUTES['CLAIM_CONTENT'],
  POINTS_ROUTES['REFERRAL_CONTENT'],
] as const;

type SwipeRoute = (typeof SWIPE_ROUTES)[number];

const SWIPE_ROUTES_SET = new Set<SwipeRoute>(SWIPE_ROUTES);

export function isSwipeRoute(route: string | SwipeRoute): route is SwipeRoute {
  return SWIPE_ROUTES_SET.has(route as SwipeRoute);
}

export const useNavigationStore = createRainbowStore<NavigationStore>((set, get) => ({
  activeRoute: Routes.WALLET_SCREEN,
  activeSwipeRoute: Routes.WALLET_SCREEN,
  animatedActiveRoute: makeMutable<string>(Routes.WALLET_SCREEN),
  animatedActiveSwipeRoute: makeMutable<SwipeRoute>(Routes.WALLET_SCREEN),
  isWalletScreenMounted: false,

  isRouteActive: (route: string) => route === get().activeRoute,

  setActiveRoute: (route: string) =>
    set(state => {
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
