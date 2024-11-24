import { NativeModules } from 'react-native';
import { analytics } from '@/analytics';
import { StatusBarHelper } from '@/helpers';
import { POINTS_ROUTES } from '@/screens/points/PointsScreen';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { currentColors } from '@/theme';
import { sentryUtils } from '../utils';
import { Navigation } from './index';
import Routes from './routesNames';

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
  const routeName = Navigation.getActiveRouteName();
  if (currentColors.theme === 'dark') {
    StatusBarHelper.setLightContent();
    return;
  }
  const isFromWalletScreen = Navigation.getActiveRoute()?.params?.isFromWalletScreen;

  const isRoutesLengthDecrease = prevState?.routes.length > currentState?.routes.length;
  switch (routeName) {
    case Routes.EXPANDED_ASSET_SHEET:
      // handles the status bar when opening nested modals
      if (isRoutesLengthDecrease && isFromWalletScreen && routeName === Routes.EXPANDED_ASSET_SHEET) {
        StatusBarHelper.setDarkContent();
        break;
      } else if (!android && isFromWalletScreen && memRouteName !== Routes.WALLET_SCREEN) {
        StatusBarHelper.setLightContent();
        break;
      }
      break;
    case Routes.PROFILE_SCREEN:
    case Routes.WALLET_SCREEN:
    case Routes.DISCOVER_SCREEN:
    case Routes.POINTS_SCREEN:
    case POINTS_ROUTES.CLAIM_CONTENT:
    case POINTS_ROUTES.REFERRAL_CONTENT:
    case Routes.DAPP_BROWSER_SCREEN:
    case Routes.WELCOME_SCREEN:
    case Routes.CHANGE_WALLET_SHEET:
    case Routes.SWAP_NAVIGATOR:
    case Routes.SWAP:
      StatusBarHelper.setDarkContent();
      break;

    default:
      StatusBarHelper.setLightContent();
  }
}

export function onNavigationStateChange(currentState) {
  const routeName = Navigation.getActiveRouteName();

  const prevState = memState;
  memState = currentState;

  if (android) {
    NativeModules.MenuViewModule.dismiss();
    setTimeout(NativeModules.MenuViewModule.dismiss, 400);
  }

  useNavigationStore.getState().setActiveRoute(routeName);

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
