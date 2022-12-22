import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet } from '@/screens/AddWalletSheet';
import { ImportSeedPhraseSheet } from '@/screens/ImportSeedPhraseSheet';
import { IS_ANDROID } from '@/env';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import { BackgroundProvider, Box } from '@/design-system';
import { StatusBar, View } from 'react-native';
import { useImportingWallet } from '@/hooks';

const Swipe = createMaterialTopTabNavigator();

export const contentHeight =
  deviceUtils.dimensions.height - SheetHandleFixedToTopHeight;

export const AddWalletNavigator = () => {
  const { inputRef } = useImportingWallet();
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
                listeners={{
                  focus: () => {
                    setScrollEnabled(false);
                    setTimeout(() => {
                      console.log('HELLOOOOOO');
                      // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
                      inputRef.current?.focus();
                    }, 500);
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
