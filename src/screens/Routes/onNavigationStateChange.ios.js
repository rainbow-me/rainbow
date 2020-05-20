import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import { StatusBar } from 'react-native';
import { NavigationActions } from 'react-navigation';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { Navigation } from '../../navigation';
import { expandedPreset } from '../../navigation/transitions/effects';
import { sentryUtils } from '../../utils';
import Routes from './routesNames';

const routesForNativeStackFallback = {
  [Routes.ADD_CASH_SHEET]: true,
  [Routes.IMPORT_SEED_PHRASE_SHEET]: true,
  [Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR]: true,
  [Routes.MAIN_NAVIGATOR]: true,
  [Routes.MODAL_SCREEN]: true,
  [Routes.SAVINGS_DEPOSIT_MODAL]: true,
  [Routes.SAVINGS_DEPOSIT_MODAL]: true,
  [Routes.SEND_SHEET]: true,
  [Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN]: true,
};

export function onNavigationStateChange(prevState, currentState) {
  const { params, routeName } = Navigation.getActiveRoute(currentState);
  const prevRouteName = Navigation.getActiveRouteName(prevState);
  // native stack rn does not support onTransitionEnd and onTransitionStart
  // Set focus manually on route changes

  if (
    prevRouteName !== routeName &&
    isNativeStackAvailable &&
    (routesForNativeStackFallback[prevRouteName] ||
      routesForNativeStackFallback[routeName])
  ) {
    Navigation.handleAction(
      NavigationActions.setParams({
        key: routeName,
        params: { focused: true },
      })
    );

    Navigation.handleAction(
      NavigationActions.setParams({
        key: prevRouteName,
        params: { focused: false },
      })
    );
  }

  const oldBottomSheetStackRoute = prevState.routes[prevState.index].routeName;
  const newBottomSheetStackRoute =
    currentState.routes[currentState.index].routeName;

  const wasCustomSlackOpen =
    oldBottomSheetStackRoute === Routes.RECEIVE_MODAL ||
    oldBottomSheetStackRoute === Routes.SETTINGS_MODAL;
  const isCustomSlackOpen =
    newBottomSheetStackRoute === Routes.RECEIVE_MODAL ||
    newBottomSheetStackRoute === Routes.SETTINGS_MODAL;

  if (wasCustomSlackOpen !== isCustomSlackOpen) {
    expandedPreset.onTransitionStart({ closing: wasCustomSlackOpen });
  }

  if (
    prevRouteName !== Routes.QR_SCANNER_SCREEN &&
    routeName === Routes.QR_SCANNER_SCREEN
  ) {
    StatusBar.setBarStyle('light-content', true);
  }

  if (
    prevRouteName === Routes.QR_SCANNER_SCREEN &&
    routeName !== Routes.QR_SCANNER_SCREEN
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (
    prevRouteName === Routes.IMPORT_SEED_PHRASE_SHEET &&
    (routeName === Routes.PROFILE_SCREEN || routeName === Routes.WALLET_SCREEN)
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (prevRouteName === Routes.WALLET_SCREEN && routeName === 'SendSheet') {
    StatusBar.setBarStyle('light-content', true);
  }

  if (
    prevRouteName === Routes.SEND_SHEET &&
    (routeName === Routes.PROFILE_SCREEN || routeName === Routes.WALLET_SCREEN)
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (
    prevRouteName === Routes.ADD_CASH_SHEET &&
    (routeName === Routes.PROFILE_SCREEN || routeName === Routes.WALLET_SCREEN)
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (routeName === 'SettingsModal') {
    let subRoute = get(params, 'section.title');
    if (subRoute === 'Settings') subRoute = null;
    return analytics.screen(`${routeName}${subRoute ? `>${subRoute}` : ''}`);
  }

  if (routeName !== prevRouteName) {
    let paramsToTrack = null;

    if (routeName === Routes.EXPANDED_ASSET_SHEET) {
      const { asset, type } = params;
      paramsToTrack = {
        assetContractAddress:
          asset.address || get(asset, 'asset_contract.address'),
        assetName: asset.name,
        assetSymbol: asset.symbol || get(asset, 'asset_contract.symbol'),
        assetType: type,
      };
    }
    sentryUtils.addNavBreadcrumb(prevRouteName, routeName, paramsToTrack);
    return analytics.screen(routeName, paramsToTrack);
  }
}
