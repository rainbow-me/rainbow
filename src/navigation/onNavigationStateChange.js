import { NativeModules } from 'react-native';
import { sentryUtils } from '../utils';
import Routes from './routesNames';
import { Navigation } from './index';
import { StatusBarHelper } from '@/helpers';
import { analytics } from '@/analytics';
import { currentColors } from '@/theme';

let memState;
let memRouteName;
let memPrevRouteName;

let action = null;

const isOnSwipeScreen = name =>
  [
    Routes.WALLET_SCREEN,
    Routes.DISCOVER_SCREEN,
    Routes.PROFILE_SCREEN,
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
  const isFromWalletScreen = Navigation.getActiveRoute()?.params
    ?.isFromWalletScreen;

  const isRoutesLengthDecrease =
    prevState?.routes.length > currentState?.routes.length;
  switch (routeName) {
    case Routes.EXPANDED_ASSET_SHEET:
      // handles the status bar when opening nested modals
      if (
        isRoutesLengthDecrease &&
        isFromWalletScreen &&
        routeName === Routes.EXPANDED_ASSET_SHEET
      ) {
        StatusBarHelper.setDarkContent();
        break;
      } else if (
        !android &&
        isFromWalletScreen &&
        memRouteName !== Routes.WALLET_SCREEN
      ) {
        StatusBarHelper.setLightContent();
        break;
      }
      break;
    case Routes.PROFILE_SCREEN:
    case Routes.WALLET_SCREEN:
    case Routes.DISCOVER_SCREEN:
    case Routes.WELCOME_SCREEN:
    case Routes.CHANGE_WALLET_SHEET:
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
      const { asset, type } = Navigation.getActiveRoute().params;
      paramsToTrack = {
        assetContractAddress: asset.address || asset?.asset_contract?.address,
        assetName: asset.name,
        assetSymbol: asset.symbol || asset?.asset_contract?.symbol,
        assetType: type,
      };
    }

    sentryUtils.addNavBreadcrumb(memPrevRouteName, routeName, paramsToTrack);
    return analytics.screen(routeName, paramsToTrack);
  }
}
