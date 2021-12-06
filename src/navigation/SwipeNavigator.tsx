import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useMemo, useState } from 'react';
import { FlexItem } from '../components/layout';
import { TestnetToast } from '../components/toasts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ProfileScreen' was resolved to ... Remove this comment to see the full error message
import ProfileScreen from '../screens/ProfileScreen';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/QRScannerScreen' was resolved t... Remove this comment to see the full error message
import QRScannerScreen from '../screens/QRScannerScreen';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/WalletScreen' was resolved to '... Remove this comment to see the full error message
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ScrollPagerWrapper' was resolved to '/Us... Remove this comment to see the full error message
import ScrollPagerWrapper from './ScrollPagerWrapper';
import Routes from './routesNames';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useCoinListEdited } from '@rainbow-me/hooks';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

const renderPager = (props: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ScrollPagerWrapper {...props} initialScrollPosition={1} />
);

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const { network } = useAccountSettings();
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const params = useMemo(() => ({ setSwipeEnabled }), []);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FlexItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Swipe.Navigator
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
        initialLayout={deviceUtils.dimensions}
        initialRouteName={Routes.WALLET_SCREEN}
        pager={renderPager}
        swipeEnabled={swipeEnabled && !isCoinListEdited}
        tabBar={renderTabBar}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Swipe.Screen
          component={QRScannerScreen}
          initialParams={params}
          name={Routes.QR_SCANNER_SCREEN}
        />
      </Swipe.Navigator>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TestnetToast network={network} />
    </FlexItem>
  );
}
