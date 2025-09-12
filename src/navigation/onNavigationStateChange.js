import { NativeModules } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { analytics } from '@/analytics';
import { POINTS_ROUTES } from '@/screens/points/PointsScreen';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { currentColors } from '@/theme';
import { sentryUtils } from '../utils';
import { Navigation } from './index';
import Routes from './routesNames';
import { isSplashScreenHidden } from '@/hooks/useHideSplashScreen';

let memState;
let memRouteName;
let memPrevRouteName;

let action = null;

const isOnSwipeScreen = name =>
  [
    Routes.WALLET_SCREEN,
    Routes.DISCOVER_SCREEN,
    Routes.PROFILE_SCREEN,
    Routes.POINTS_SCREEN,
    POINTS_ROUTES.CLAIM_CONTENT,
    POINTS_ROUTES.REFERRAL_CONTENT,
    Routes.DAPP_BROWSER_SCREEN,
  ].includes(name);

export function triggerOnSwipeLayout(newAction) {
  if (isOnSwipeScreen(Navigation.getActiveRoute()?.name)) {
    newAction();
  } else {
    action = newAction;
  }
}

export function onHandleStatusBar(currentState, prevState) {
  // Skip updating the system bars while the splash screen is visible
  // this will be called again once splash screen is hidden.
  if (!isSplashScreenHidden()) return;

  const routeName = Navigation.getActiveRouteName();
  if (currentColors.theme === 'dark') {
    SystemBars.setStyle('light');
    return;
  }
  const isFromWalletScreen = Navigation.getActiveRoute()?.params?.isFromWalletScreen;

  const isRoutesLengthDecrease = prevState?.routes.length > currentState?.routes.length;
  switch (routeName) {
    case Routes.EXPANDED_ASSET_SHEET: {
      // handles the status bar when opening nested modals
      if (isRoutesLengthDecrease && isFromWalletScreen && routeName === Routes.EXPANDED_ASSET_SHEET) {
        SystemBars.setStyle({ statusBar: 'dark' });
        break;
      } else if (!android && isFromWalletScreen && memRouteName !== Routes.WALLET_SCREEN) {
        SystemBars.setStyle({ statusBar: 'light' });
        break;
      }
      break;
    }

    // Full light screens - dark status bar and navigation bar.
    case Routes.KING_OF_THE_HILL:
    case Routes.EXPANDED_ASSET_SHEET_V2:
    case Routes.PROFILE_SCREEN:
    case Routes.WALLET_SCREEN:
    case Routes.DISCOVER_SCREEN:
    case Routes.POINTS_SCREEN:
    case POINTS_ROUTES.CLAIM_CONTENT:
    case POINTS_ROUTES.REFERRAL_CONTENT:
    case Routes.DAPP_BROWSER_SCREEN:
    case Routes.WELCOME_SCREEN:
    case Routes.SWAP_NAVIGATOR:
    case Routes.PIN_AUTHENTICATION_SCREEN:
    case Routes.SWAP: {
      SystemBars.setStyle('dark');
      break;
    }

    // Full dark screens - light status bar and navigation bar.
    case Routes.CONSOLE_SHEET:
    case Routes.CHANGE_WALLET_SHEET:
    case Routes.NETWORK_SELECTOR:
    case Routes.QR_SCANNER_SCREEN: {
      SystemBars.setStyle('light');
      break;
    }

    // Dark sheets with top padding - dark status bar and light navigation bar.
    case Routes.RECEIVE_MODAL: {
      SystemBars.setStyle({ statusBar: 'dark', navigationBar: 'light' });
      break;
    }

    // Sheets with top padding - light status bar and dark navigation bar.
    default: {
      SystemBars.setStyle({ statusBar: 'light', navigationBar: 'dark' });
    }
  }
}

const setActiveRoute = useNavigationStore.getState().setActiveRoute;

export function onNavigationStateChange(currentState) {
  const routeName = Navigation.getActiveRouteName();

  const prevState = memState;
  memState = currentState;

  if (android) {
    NativeModules.MenuViewModule.dismiss();
    setTimeout(NativeModules.MenuViewModule.dismiss, 400);
  }

  setActiveRoute(routeName);

  if (isOnSwipeScreen(routeName)) {
    action?.();
    action = undefined;
  }

  onHandleStatusBar(currentState, prevState);

  memPrevRouteName = memRouteName;
  memRouteName = routeName;

  if (routeName !== memPrevRouteName) {
    let paramsToTrack = null;

    if (routeName === Routes.EXPANDED_ASSET_SHEET) {
      const { asset } = Navigation.getActiveRoute().params;
      paramsToTrack = {
        assetContractAddress: asset.address || asset?.asset_contract?.address,
        assetName: asset.name,
        assetSymbol: asset.symbol || asset?.asset_contract?.symbol,
        network: asset.network,
      };
    }

    sentryUtils.addNavBreadcrumb(memPrevRouteName, routeName, paramsToTrack);
    return analytics.screen(routeName, paramsToTrack);
  }
}
