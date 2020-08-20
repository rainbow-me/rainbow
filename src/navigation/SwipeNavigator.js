import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import useExperimentalFlag, {
  CHARTS_EXAMPLE,
} from '../config/experimentalHooks';
import { useCoinListEdited } from '../hooks';
import Example from '../react-native-animated-charts/InternalExample/Example';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
import { ScrollPagerWrapper, scrollPosition } from './helpers';
import Routes from './routesNames';
const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

const renderPager = props => <ScrollPagerWrapper {...props} />;

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const showChartsExample = useExperimentalFlag(CHARTS_EXAMPLE);

  return (
    <Swipe.Navigator
      initialLayout={deviceUtils.dimensions}
      initialRouteName={
        showChartsExample ? Routes.CHARTS_EXAMPLE : Routes.WALLET_SCREEN
      }
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
      {showChartsExample && (
        <Swipe.Screen component={Example} name={Routes.CHARTS_EXAMPLE} />
      )}
    </Swipe.Navigator>
  );
}
