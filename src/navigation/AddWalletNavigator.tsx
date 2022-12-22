import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet } from '@/screens/AddWalletSheet';
import { ImportSeedPhraseSheet } from '@/screens/ImportSeedPhraseSheet';
import { IS_ANDROID } from '@/env';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import { BackgroundProvider } from '@/design-system';
import { StatusBar, View } from 'react-native';

const Swipe = createMaterialTopTabNavigator();

export const contentHeight =
  deviceUtils.dimensions.height - SheetHandleFixedToTopHeight;

export const AddWalletNavigator = () => {
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
                name={Routes.ADD_WALLET_SHEET}
                listeners={{
                  focus: () => setScrollEnabled(true),
                }}
              />
              <Swipe.Screen
                component={ImportSeedPhraseSheet}
                name={Routes.IMPORT_SEED_PHRASE_FLOW}
              />
            </Swipe.Navigator>
          </SlackSheet>
        )}
      </BackgroundProvider>
    </View>
  );
};
