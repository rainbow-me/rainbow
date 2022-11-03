import { NativeModules } from 'react-native';
// eslint-disable-next-line import/default
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
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
    case Routes.EXPANDED_ASSET_SHEET_POOLS:
      // handles the status bar when opening nested modals
      if (
        isRoutesLengthDecrease &&
        isFromWalletScreen &&
        (routeName === Routes.EXPANDED_ASSET_SHEET_POOLS ||
          routeName === Routes.EXPANDED_ASSET_SHEET)
      ) {
        StatusBarHelper.setDarkContent();
        break;
      } else if (
        !android &&
        isFromWalletScreen &&
        routeName !== Routes.EXPANDED_ASSET_SHEET_POOLS &&
        memRouteName !== Routes.WALLET_SCREEN
      ) {
        StatusBarHelper.setLightContent();
        break;
      }
      break;
    case Routes.PROFILE_SCREEN:
    case Routes.WALLET_SCREEN:
    case Routes.DISCOVER_SCREEN:
    case Routes.WYRE_WEBVIEW:
    case Routes.SAVINGS_SHEET:
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

  if (android) {
    if (
      routeName === Routes.MAIN_EXCHANGE_SCREEN ||
      routeName === Routes.SAVINGS_WITHDRAW_MODAL ||
      routeName === Routes.SEND_SHEET ||
      routeName === Routes.SEND_SHEET_NAVIGATOR ||
      routeName === Routes.SWAP_DETAILS_SCREEN ||
      routeName === Routes.SWAP_DETAILS_SHEET ||
      routeName === Routes.QR_SCANNER_SCREEN ||
      routeName === Routes.CUSTOM_GAS_SHEET ||
      routeName === Routes.ENS_INTRO_SHEET ||
      routeName === Routes.SWAPS_PROMO_SHEET ||
      routeName === Routes.WALLET_SCREEN ||
      routeName === Routes.ENS_SEARCH_SHEET ||
      routeName === Routes.ENS_ASSIGN_RECORDS_SHEET ||
      (routeName === Routes.MODAL_SCREEN &&
        (Navigation.getActiveRoute().params?.type === 'contact_profile' ||
          Navigation.getActiveRoute().params?.type === 'wallet_profile'))
    ) {
      AndroidKeyboardAdjust.setAdjustPan();
    } else {
      AndroidKeyboardAdjust.setAdjustResize();
    }
  }

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
