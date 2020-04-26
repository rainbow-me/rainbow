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
  [Routes.MAIN_NAVIGATOR]: true,
  [Routes.OVERLAY_EXPANDED_ASSET_SCREEN]: true,
  [Routes.OVERLAY_EXPANDED_SUPPORTED_COUNTRIES]: true,
  [Routes.SEND_SHEET]: true,
  [Routes.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR]: true,
  [Routes.SAVINGS_DEPOSIT_MODAL]: true,
  [Routes.SAVINGS_DEPOSIT_MODAL]: true,
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

  const oldBottomSheetStackindex = prevState.index;
  const newBottomSheetStackIndex = currentState.index;

  if (oldBottomSheetStackindex !== newBottomSheetStackIndex) {
    expandedPreset.onTransitionStart({ closing: !newBottomSheetStackIndex });
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

    if (routeName === Routes.EXPANDED_ASSET_SCREEN) {
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
