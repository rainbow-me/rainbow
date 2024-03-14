import React, { useEffect, useState } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import RNFS from 'react-native-fs';

import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import { Page } from '@/components/layout';
import { Box, ColorModeProvider, globalColors } from '@/design-system';

import { safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { AddressBar } from './AddressBar';
import { BrowserTab } from './BrowserTab';
import { StyleSheet } from 'react-native';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';

const getInjectedJS = async () => {
  return RNFS.readFile(`${RNFS.MainBundlePath}/InjectedJSBundle.js`, 'utf8');
};

const DappBrowserComponent = () => {
  const [injectedJS, setInjectedJS] = useState<string | ''>('');

  useEffect(() => {
    const loadInjectedJS = async () => {
      try {
        const jsToInject = await getInjectedJS();
        setInjectedJS(jsToInject);
      } catch (e) {
        console.log('error', e);
      }
    };
    loadInjectedJS();
  }, []);

  const { scrollViewRef, tabStates, tabViewProgress, tabViewVisible } = useBrowserContext();

  const backgroundStyle = useAnimatedStyle(
    () => ({
      opacity: tabViewProgress?.value ?? 0,
    }),
    []
  );

  return (
    <SheetGestureBlocker>
      <Box as={Page} height="full" style={styles.rootViewBackground} width="full">
        <Box
          as={Animated.View}
          borderRadius={ScreenCornerRadius}
          height="full"
          position="absolute"
          style={[backgroundStyle, { backgroundColor: globalColors.grey100 }]}
          width="full"
        />
        <Animated.ScrollView
          contentContainerStyle={{
            backgroundColor: globalColors.grey100,
            height: Math.ceil(tabStates.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 104,
            zIndex: 20000,
          }}
          ref={scrollViewRef}
          scrollEnabled={tabViewVisible}
          showsVerticalScrollIndicator={false}
        >
          {tabStates.map((tab, index) => (
            <BrowserTab key={index} tabIndex={index} injectedJS={injectedJS} />
          ))}
        </Animated.ScrollView>

        <AddressBar />
      </Box>
    </SheetGestureBlocker>
  );
};

export const DappBrowser = () => {
  return (
    <BrowserContextProvider>
      <ColorModeProvider value="dark">
        <DappBrowserComponent />
      </ColorModeProvider>
    </BrowserContextProvider>
  );
};

const styles = StyleSheet.create({
  rootViewBackground: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
