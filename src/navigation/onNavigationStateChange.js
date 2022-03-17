import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
// eslint-disable-next-line import/default
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import { StatusBar } from 'react-native-bars';
import currentColors from '../context/currentColors';
import { sentryUtils } from '../utils';
import Routes from './routesNames';
import { Navigation } from './index';

let memRouteName;

let action = null;

const isOnSwipeScreen = name =>
  [
    Routes.WALLET_SCREEN,
    Routes.QR_SCANNER_SCREEN,
    Routes.PROFILE_SCREEN,
  ].includes(name);

export function triggerOnSwipeLayout(newAction) {
  if (isOnSwipeScreen(Navigation.getActiveRoute()?.name)) {
    newAction();
  } else {
    action = newAction;
  }
}

export function onNavigationStateChange(updateStatusBarOnSameRoute) {
  const { name: routeName } = Navigation.getActiveRoute();

  if (isOnSwipeScreen(routeName)) {
    action?.();
    action = undefined;
  }

  const prevRouteName = memRouteName;
  memRouteName = routeName;

  if (
    currentColors.theme === 'dark' ||
    (routeName === Routes.CURRENCY_SELECT_SCREEN && ios)
  ) {
    StatusBar.pushStackEntry({
      animated: true,
      barStyle: 'light-content',
    });
  } else if (routeName !== prevRouteName || updateStatusBarOnSameRoute) {
    switch (routeName) {
      case Routes.PROFILE_SCREEN:
      case Routes.WALLET_SCREEN:
      case Routes.CURRENCY_SELECT_SCREEN:
      case Routes.WYRE_WEBVIEW:
      case Routes.SAVINGS_SHEET:
      case Routes.WELCOME_SCREEN:
        StatusBar.pushStackEntry({
          animated: true,
          barStyle: 'dark-content',
        });
        break;

      default:
        StatusBar.pushStackEntry({
          animated: true,
          barStyle: 'light-content',
        });
    }
  }

  if (android) {
    if (
      routeName === Routes.MAIN_EXCHANGE_SCREEN ||
      routeName === Routes.SAVINGS_WITHDRAW_MODAL ||
      routeName === Routes.SEND_SHEET ||
      routeName === Routes.SWAP_DETAILS_SCREEN ||
      routeName === Routes.SWAP_DETAILS_SHEET ||
      routeName === Routes.QR_SCANNER_SCREEN ||
      routeName === Routes.CUSTOM_GAS_SHEET ||
      routeName === Routes.ENS_SEARCH_SHEET ||
      routeName === Routes.ENS_ASSIGN_RECORDS_SHEET ||
      (routeName === Routes.MODAL_SCREEN &&
        Navigation.getActiveRoute().params?.type === 'contact_profile')
    ) {
      AndroidKeyboardAdjust.setAdjustPan();
    } else {
      AndroidKeyboardAdjust.setAdjustResize();
    }
  }

  if (routeName !== prevRouteName) {
    let paramsToTrack = null;

    if (routeName === Routes.EXPANDED_ASSET_SHEET) {
      const { asset, type } = Navigation.getActiveRoute().params;
      paramsToTrack = {
        assetContractAddress:
          asset.address || get(asset, 'asset_contract.address'),
        assetName: asset.name,
        assetSymbol: asset.symbol || get(asset, 'asset_contract.symbol'),
        assetType: type,
      };
    }

    sentryUtils.addNavBreadcrumb(prevRouteName, routeName, paramsToTrack);
    return android
      ? paramsToTrack && analytics.screen(routeName, paramsToTrack)
      : analytics.screen(routeName, paramsToTrack);
  }
}
