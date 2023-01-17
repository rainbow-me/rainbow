import React, { useState } from 'react';
import { Dimensions, StatusBar } from 'react-native';
import { SlackSheet } from '../components/sheet';
import { sharedCoolModalTopOffset } from './config';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import { IS_ANDROID } from '@/env';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';
import { PairHardwareWalletIntroSheet } from '@/screens/PairHardwareWalletIntroSheet';
import { PairHardwareWalletSearchSheet } from '@/screens/PairHardwareWalletSearchSheet';
import { NanoXDeviceAnimation } from '@/components/hardware-wallets/NanoXDeviceAnimation';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;
const renderPager = (props: any) => (
  <ScrollPagerWrapper
    {...props}
    {...(android && {
      style: { height: Dimensions.get('window').height },
    })}
  />
);

export function PairHardwareWalletNavigator() {
  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const contentHeight =
    deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const [currentRouteName, setCurrentRouteName] = useState(
    Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET
  );

  return (
    <>
      {/* @ts-expect-error JavaScript component */}
      <SlackSheet
        additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
        contentHeight={contentHeight}
        height="100%"
        removeTopPadding
        scrollEnabled={false}
      >
        <StatusBar barStyle="light-content" />
        <Box
          style={{
            height: contentHeight,
          }}
        >
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={currentRouteName}
            pager={renderPager}
            swipeEnabled={false}
            tabBar={renderTabBar}
            lazy
          >
            <Swipe.Screen
              component={PairHardwareWalletIntroSheet}
              name={Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET);
                },
              }}
            />
            <Swipe.Screen
              component={PairHardwareWalletSearchSheet}
              name={Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET);
                },
              }}
            />
          </Swipe.Navigator>
          <NanoXDeviceAnimation
            height={contentHeight}
            state={
              currentRouteName === Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET
                ? 'loading'
                : 'idle'
            }
            show={
              currentRouteName === Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET ||
              currentRouteName === Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET
            }
            width={deviceUtils.dimensions.width}
          />
        </Box>
      </SlackSheet>
    </>
  );
}
