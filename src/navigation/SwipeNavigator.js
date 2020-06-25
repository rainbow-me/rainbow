import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreenWithData from '../screens/QRScannerScreenWithData';
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
import { ScrollPagerWrapper } from './helpers';
import Routes from './routesNames';
const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

export function SwipeNavigator() {
  return (
    <Swipe.Navigator
      initialRouteName={Routes.WALLET_SCREEN}
      tabBar={renderTabBar}
      initialLayout={deviceUtils.dimensions}
      pager={ScrollPagerWrapper}
    >
      <Swipe.Screen name={Routes.PROFILE_SCREEN} component={ProfileScreen} />
      <Swipe.Screen name={Routes.WALLET_SCREEN} component={WalletScreen} />
      <Swipe.Screen
        name={Routes.QR_SCANNER_SCREEN}
        component={QRScannerScreenWithData}
      />
    </Swipe.Navigator>
  );
}
