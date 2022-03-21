import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
// eslint-disable-next-line import/default
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import currentColors from '../context/currentColors';
import { StatusBarService } from '../services';
import { sentryUtils } from '../utils';
import Routes from './routesNames';
import { Navigation } from './index';

let memRouteName;
let memPrevRouteName;

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

export function onHandleStatusBar() {
  StatusBarService.setHidden(false);
  const routeName = Navigation.getActiveRouteName();

  if (currentColors.theme === 'dark') {
    StatusBarService.setLightContent();
    return;
  }

  switch (routeName) {
    case Routes.PROFILE_SCREEN:
    case Routes.WALLET_SCREEN:
    case Routes.WYRE_WEBVIEW:
    case Routes.SAVINGS_SHEET:
    case Routes.WELCOME_SCREEN:
      StatusBarService.setDarkContent();
      break;
    case Routes.CURRENCY_SELECT_SCREEN:
      StatusBarService.pushStackEntry({
        animated: true,
        barStyle: ios ? 'light-content' : 'dark-content',
      });
      break;

    default:
      StatusBarService.setLightContent();
  }
}

export function onNavigationStateChange() {
  const routeName = Navigation.getActiveRouteName();

  if (isOnSwipeScreen(routeName)) {
    action?.();
    action = undefined;
  }

  memPrevRouteName = memRouteName;
  memRouteName = routeName;

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

  if (!ios && !memPrevRouteName) {
    setTimeout(() => {
      onHandleStatusBar(); //first app launch
    }, 100);
  } else {
    onHandleStatusBar();
  }

  if (routeName !== memPrevRouteName) {
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

    sentryUtils.addNavBreadcrumb(memPrevRouteName, routeName, paramsToTrack);

    return android
      ? paramsToTrack && analytics.screen(routeName, paramsToTrack)
      : analytics.screen(routeName, paramsToTrack);
  }
}
