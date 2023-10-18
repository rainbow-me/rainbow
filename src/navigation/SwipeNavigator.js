import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useMemo, useState } from 'react';
import { FlexItem } from '../components/layout';
import { TestnetToast } from '../components/toasts';
import { web3Provider } from '@/handlers/web3';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { WalletScreen } from '@/screens/WalletScreen';
import { deviceUtils } from '../utils';
import Routes from './routesNames';
import { useAccountSettings, useCoinListEdited } from '@/hooks';
import { useTheme } from '@/theme';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const { colors } = useTheme();
  const { network } = useAccountSettings();
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const params = useMemo(() => ({ setSwipeEnabled }), []);

  return (
    <FlexItem style={{ backgroundColor: colors.white }}>
      <Swipe.Navigator
        initialLayout={deviceUtils.dimensions}
        initialRouteName={Routes.WALLET_SCREEN}
        swipeEnabled={swipeEnabled && !isCoinListEdited}
        tabBar={renderTabBar}
      >
        <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} />
        <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} />
        <Swipe.Screen
          component={DiscoverScreen}
          name={Routes.DISCOVER_SCREEN}
          initialParams={params}
        />
      </Swipe.Navigator>
      <TestnetToast network={network} web3Provider={web3Provider} />
    </FlexItem>
  );
}
