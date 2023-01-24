import React, { useState } from 'react';
import { Dimensions, StatusBar, View } from 'react-native';
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
import { PairHardwareWalletSuccessSheet } from '@/screens/PairHardwareWalletSuccessSheet';
import { CheckmarkAnimation } from '@/components/animations/CheckmarkAnimation';
import * as i18n from '@/languages';
import { PairHardwareWalletSigningSheet } from '@/screens/PairHardwareWalletSigningSheet';

const Swipe = createMaterialTopTabNavigator();
export const TRANSLATIONS = i18n.l.hardware_wallets;

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
    Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET
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
            <Swipe.Screen
              component={PairHardwareWalletSuccessSheet}
              name={Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(
                    Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET
                  );
                },
              }}
            />
            <Swipe.Screen
              component={PairHardwareWalletSigningSheet}
              name={Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(
                    Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET
                  );
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
              width={deviceUtils.dimensions.width}
            />
          )}
          {currentRouteName === Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET && (
            <Box
              width={{ custom: deviceUtils.dimensions.width }}
              height={{ custom: contentHeight }}
              alignItems="center"
              justifyContent="center"
              position="absolute"
            >
              <CheckmarkAnimation />
            </Box>
          )}
        </Box>
      </SlackSheet>
    </>
  );
}
