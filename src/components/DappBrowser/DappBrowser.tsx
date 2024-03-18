import React, { useEffect, useState } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import RNFS from 'react-native-fs';

import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';

import { safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { AddressBar } from './AddressBar';
import { BrowserTab } from './BrowserTab';
import { StyleSheet } from 'react-native';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';
import { IS_ANDROID } from '@/env';

const getInjectedJS = async () => {
  const baseDirectory = IS_ANDROID ? RNFS.DocumentDirectoryPath : RNFS.MainBundlePath;

  if (IS_ANDROID) {
    return RNFS.readFileRes('injected_js_bundle.js', 'utf8');
  } else {
    return RNFS.readFile(`${baseDirectory}/InjectedJSBundle.js`, 'utf8');
  }
};

const DappBrowserComponent = () => {
  const { isDarkMode } = useColorMode();
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
    <Box as={Page} height="full" style={isDarkMode ? styles.rootViewBackground : styles.rootViewBackgroundLight} width="full">
      <Box
        as={Animated.View}
        borderRadius={ScreenCornerRadius}
        height="full"
        position="absolute"
        style={[
          backgroundStyle,
          {
            backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD',
            paddingTop: android ? 30 : 0,
          },
        ]}
        width="full"
      />
      <Animated.ScrollView
        contentContainerStyle={{
          backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD',
          height: Math.ceil(tabStates.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + (android ? 35 : 0) + 104,
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
  );
};

export const DappBrowser = () => {
  return (
    <BrowserContextProvider>
      <DappBrowserComponent />
    </BrowserContextProvider>
  );
};

const styles = StyleSheet.create({
  rootViewBackground: {
    backgroundColor: globalColors.grey100,
    flex: 1,
  },
  rootViewBackgroundLight: {
    backgroundColor: '#FBFCFD',
    flex: 1,
  },
});
