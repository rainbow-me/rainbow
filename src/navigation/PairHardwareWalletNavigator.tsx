import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SlackSheet } from '../components/sheet';
import { sharedCoolModalTopOffset } from './config';
import { Box } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';
import { PairHardwareWalletIntroSheet } from '@/screens/PairHardwareWalletIntroSheet';
import { PairHardwareWalletSearchSheet } from '@/screens/PairHardwareWalletSearchSheet';
import { NanoXDeviceAnimation } from '@/components/hardware-wallets/NanoXDeviceAnimation';
import { PairHardwareWalletSuccessSheet } from '@/screens/PairHardwareWalletSuccessSheet';
import * as i18n from '@/languages';
import { PairHardwareWalletSigningSheet } from '@/screens/PairHardwareWalletSigningSheet';
import { useDimensions } from '@/hooks';

export const TRANSLATIONS = i18n.l.hardware_wallets;

const Swipe = createMaterialTopTabNavigator();
const renderTabBar = () => null;

export function PairHardwareWalletNavigator() {
  const [currentRouteName, setCurrentRouteName] = useState(
    Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET
  );

  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const contentHeight =
    deviceHeight - (!deviceUtils.isSmallPhone ? sharedCoolModalTopOffset : 0);

  return (
    // @ts-expect-error JavaScript component
    <SlackSheet
      additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
      contentHeight={contentHeight}
      height="100%"
      removeTopPadding
      scrollEnabled={false}
    >
      <StatusBar barStyle="light-content" />
      <Box height={{ custom: contentHeight }}>
        <Swipe.Navigator
          initialLayout={{ height: deviceHeight, width: deviceWidth }}
          initialRouteName={currentRouteName}
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
          <Swipe.Screen
            component={PairHardwareWalletSuccessSheet}
            name={Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET}
            listeners={{
              focus: () => {
                setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET);
              },
            }}
          />
          <Swipe.Screen
            component={PairHardwareWalletSigningSheet}
            name={Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET}
            listeners={{
              focus: () => {
                setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET);
              },
            }}
          />
        </Swipe.Navigator>
        {(currentRouteName === Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET ||
          currentRouteName === Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET) && (
          <NanoXDeviceAnimation
            height={contentHeight}
            state={
              currentRouteName === Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET
                ? 'loading'
                : 'idle'
            }
            width={deviceWidth}
          />
        )}
      </Box>
    </SlackSheet>
  );
}
