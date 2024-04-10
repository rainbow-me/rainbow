import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { interpolateColor, runOnJS, useAnimatedProps, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import RNFS from 'react-native-fs';

import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { BrowserTab, pruneScreenshots } from './BrowserTab';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';
import { Search } from './search/Search';
import { TabViewToolbar } from './TabViewToolbar';
import { SheetGestureBlocker } from '../sheet/SheetGestureBlocker';
import { ProgressBar } from './ProgressBar';
import { RouteProp, useRoute } from '@react-navigation/native';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const getInjectedJS = async () => {
  const baseDirectory = IS_ANDROID ? RNFS.DocumentDirectoryPath : RNFS.MainBundlePath;

  if (IS_ANDROID) {
    return RNFS.readFileRes('injected_js_bundle.js', 'utf8');
  } else {
    return RNFS.readFile(`${baseDirectory}/InjectedJSBundle.js`, 'utf8');
  }
};

export type DappBrowserParams = {
  url: string;
};

type RouteParams = {
  DappBrowserParams: DappBrowserParams;
};

const DappBrowserComponent = () => {
  const { isDarkMode } = useColorMode();
  const [injectedJS, setInjectedJS] = useState<string | ''>('');

  const { scrollViewRef, tabStates, tabViewProgress, tabViewVisible, newTabWorklet, toggleTabViewWorklet, getActiveTabState } =
    useBrowserContext();


  const route = useRoute<RouteProp<RouteParams, 'DappBrowserParams'>>();

  useAnimatedReaction(
    () => route.params?.url,
    (current, previous) => {
      if (current !== previous && route.params?.url) {
        newTabWorklet(current);
        toggleTabViewWorklet();
      }
    },
    [newTabWorklet, route.params?.url]
  );

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

  useEffect(() => {
    pruneScreenshots(tabStates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backgroundStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value ?? 0;

    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 100],
        [isDarkMode ? globalColors.grey100 : '#FBFCFD', isDarkMode ? '#0A0A0A' : '#FBFCFD']
      ),
    };
  });

  const scrollEnabledProp = useAnimatedProps(() => ({
    scrollEnabled: tabViewVisible?.value,
  }));

  return (
    <SheetGestureBlocker>
      <Box as={Page} height="full" style={isDarkMode ? styles.rootViewBackground : styles.rootViewBackgroundLight} width="full">
        <Box
          as={Animated.View}
          height="full"
          position="absolute"
          style={[
            backgroundStyle,
            {
              paddingTop: android ? 30 : 0,
            },
          ]}
          width="full"
        />
        <AnimatedScrollView
          animatedProps={scrollEnabledProp}
          contentContainerStyle={{
            height: Math.ceil(tabStates.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + (android ? 35 : 0) + 165 + 28,
            zIndex: 20000,
          }}
          ref={scrollViewRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {tabStates.map((_, index) => (
            <BrowserTab key={tabStates[index].uniqueId} tabId={tabStates[index].uniqueId} tabIndex={index} injectedJS={injectedJS} />
          ))}
        </AnimatedScrollView>
        <ProgressBar />
        <TabViewToolbar />
        <Search />
      </Box>
    </SheetGestureBlocker>
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
