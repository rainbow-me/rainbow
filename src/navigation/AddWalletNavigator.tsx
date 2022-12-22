import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet } from '@/screens/AddWalletSheet';
import { ImportSeedPhraseSheet } from '@/screens/ImportSeedPhraseSheet';
import { IS_ANDROID } from '@/env';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import { BackgroundProvider } from '@/design-system';
import { StatusBar, View } from 'react-native';
import { useRoute } from '@react-navigation/core';
import { useNavigation } from './Navigation';

const Swipe = createMaterialTopTabNavigator();

export const contentHeight =
  deviceUtils.dimensions.height - SheetHandleFixedToTopHeight;

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, userData },
  } = useRoute();
  const { setParams } = useNavigation();

  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    setParams({ sheetHeight });
  }, [setParams, sheetHeight]);

  const [scrollEnabled, setScrollEnabled] = useState(false);

  return (
    <View
      style={{
        height: deviceUtils.dimensions.height,
      }}
    >
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          // @ts-expect-error js component
          <SlackSheet
            contentHeight={contentHeight}
            additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
            backgroundColor={backgroundColor}
            height="100%"
            scrollEnabled={scrollEnabled}
          >
            <Swipe.Navigator
              initialLayout={deviceUtils.dimensions}
              initialRouteName={Routes.ADD_WALLET_SHEET}
              swipeEnabled={false}
              tabBar={() => null}
            >
              <Swipe.Screen
                component={AddWalletSheet}
                initialParams={{ isFirstWallet, setSheetHeight, userData }}
                name={Routes.ADD_WALLET_SHEET}
                listeners={{
                  focus: () => {
                    setScrollEnabled(true);
                    setParams({ sheetHeight });
                  },
                }}
              />
              <Swipe.Screen
                component={ImportSeedPhraseSheet}
                name={Routes.IMPORT_SEED_PHRASE_FLOW}
                listeners={{
                  focus: () => {
                    setScrollEnabled(false);
                    setParams({ sheetHeight: undefined });
                  },
                }}
              />
            </Swipe.Navigator>
          </SlackSheet>
        )}
      </BackgroundProvider>
    </View>
  );
};
