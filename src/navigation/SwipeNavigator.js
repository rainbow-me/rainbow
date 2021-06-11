import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useMemo, useState } from 'react';
import { FlexItem } from '../components/layout';
import { TestnetToast } from '../components/toasts';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
import ScrollPagerWrapper, { scrollPosition } from './ScrollPagerWrapper';
import Routes from './routesNames';
import { useAccountSettings, useCoinListEdited } from '@rainbow-me/hooks';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

const renderPager = props => <ScrollPagerWrapper {...props} />;

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const { network } = useAccountSettings();
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const params = useMemo(() => ({ setSwipeEnabled }), []);

  return (
    <FlexItem>
      <Swipe.Navigator
        initialLayout={deviceUtils.dimensions}
        initialRouteName={Routes.WALLET_SCREEN}
        pager={renderPager}
        position={scrollPosition}
        swipeEnabled={swipeEnabled && !isCoinListEdited}
        tabBar={renderTabBar}
      >
        <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} />
        <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} />
        <Swipe.Screen
          component={QRScannerScreen}
          initialParams={params}
          name={Routes.QR_SCANNER_SCREEN}
        />
      </Swipe.Navigator>
      <TestnetToast network={network} />
    </FlexItem>
  );
}
