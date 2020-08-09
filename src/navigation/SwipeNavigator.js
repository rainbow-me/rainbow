import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useCallback } from 'react';
import { useCoinListEdited } from '../hooks';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
import { ScrollPagerWrapper, scrollPosition } from './helpers';
import Routes from './routesNames';
const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();

  const renderPager = useCallback(
    props => <ScrollPagerWrapper {...props} />,
    []
  );

  return (
    <Swipe.Navigator
      initialLayout={deviceUtils.dimensions}
      initialRouteName={Routes.WALLET_SCREEN}
      pager={renderPager}
      position={scrollPosition}
      swipeEnabled={!isCoinListEdited}
      tabBar={renderTabBar}
    >
      <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} />
      <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} />
      <Swipe.Screen
        component={QRScannerScreen}
        name={Routes.QR_SCANNER_SCREEN}
      />
    </Swipe.Navigator>
  );
}
