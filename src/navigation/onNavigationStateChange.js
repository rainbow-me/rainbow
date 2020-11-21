import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import { StatusBar } from 'react-native';
// eslint-disable-next-line import/default
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import { sentryUtils } from '../utils';
import Routes from './routesNames';
import { Navigation } from './index';

let memRouteName;
let memState;

let action = null;

const isOnSwipeScreen = name =>
  [
    Routes.WALLET_SCREEN,
    Routes.QR_SCANNER_SCREEN,
    Routes.PROFILE_SCREEN,
  ].includes(name);

export function triggerOnSwipeLayout(newAction) {
  if (isOnSwipeScreen(Navigation.getActiveRoute().name)) {
    newAction();
  } else {
    action = newAction;
  }
}

export function onNavigationStateChange(currentState) {
  const prevState = memState;
  memState = currentState;
  const { name: routeName } = Navigation.getActiveRoute();
  if (isOnSwipeScreen(routeName)) {
    action?.();
    action = undefined;
  }
  const prevRouteName = memRouteName;
  memRouteName = routeName;

  if (ios) {
    const oldBottomSheetStackRoute = prevState?.routes[prevState.index].name;
    const newBottomSheetStackRoute =
      currentState?.routes[currentState.index].name;

    const wasCustomSlackOpen =
      oldBottomSheetStackRoute === Routes.CONFIRM_REQUEST ||
      oldBottomSheetStackRoute === Routes.RECEIVE_MODAL ||
      oldBottomSheetStackRoute === Routes.SETTINGS_MODAL;
    const isCustomSlackOpen =
      newBottomSheetStackRoute === Routes.CONFIRM_REQUEST ||
      newBottomSheetStackRoute === Routes.RECEIVE_MODAL ||
      newBottomSheetStackRoute === Routes.SETTINGS_MODAL;

    if (wasCustomSlackOpen !== isCustomSlackOpen) {
      StatusBar.setBarStyle(
        wasCustomSlackOpen ? 'dark-content' : 'light-content'
      );
    }
  } else {
    if (routeName !== prevRouteName) {
      if ([prevRouteName, routeName].includes(Routes.RECEIVE_MODAL)) {
        StatusBar.setBarStyle(
          routeName === Routes.RECEIVE_MODAL ? 'light-content' : 'dark-content',
          true
        );
      }

      if (
        routeName === Routes.MAIN_EXCHANGE_SCREEN ||
        routeName === Routes.SAVINGS_WITHDRAW_MODAL ||
        routeName === Routes.SEND_SHEET ||
        routeName === Routes.SWAP_DETAILS_SCREEN
      ) {
        AndroidKeyboardAdjust.setAdjustPan();
      } else {
        AndroidKeyboardAdjust.setAdjustResize();
      }

      if ([prevRouteName, routeName].includes(Routes.QR_SCANNER_SCREEN)) {
        StatusBar.setBarStyle(
          routeName === Routes.QR_SCANNER_SCREEN
            ? 'light-content'
            : 'dark-content',
          true
        );
      }

      if ([prevRouteName, routeName].includes(Routes.BACKUP_SHEET)) {
        StatusBar.setBarStyle(
          !isOnSwipeScreen(routeName) ? 'light-content' : 'dark-content',
          true
        );
      }

      if ([prevRouteName, routeName].includes(Routes.SAVINGS_SHEET)) {
        StatusBar.setBarStyle(
          !isOnSwipeScreen(routeName) ? 'light-content' : 'dark-content',
          true
        );
      }

      if (
        routeName === Routes.EXPANDED_ASSET_SHEET &&
        Navigation.getActiveRoute().params.type === 'uniswap'
      ) {
        StatusBar.setBarStyle('light-content', true);
      }

      if (prevRouteName === Routes.EXPANDED_ASSET_SHEET) {
        StatusBar.setBarStyle('dark-content', true);
      }
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
