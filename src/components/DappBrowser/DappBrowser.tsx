import React, { useEffect, useRef, useState } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { interpolateColor, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import RNFS from 'react-native-fs';

import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { BrowserTab } from './BrowserTab';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';
import { Search } from './search/Search';
import { TabViewToolbar } from './TabViewToolbar';
import { SheetGestureBlocker } from '../sheet/SheetGestureBlocker';
import { ProgressBar } from './ProgressBar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TIMING_CONFIGS } from '../animations/animationConfigs';
import { useBrowserState } from './useBrowserState';
import { pruneScreenshots } from './screenshots';

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
  const {
    tabViewVisible,
    newTabWorklet,
    tabStates,
    currentlyOpenTabIds,
    tabViewProgress,
    activeTabIndex,
    animatedActiveTabIndex,
    closeTabWorklet,
    toggleTabViewWorklet,
    updateActiveTabState,
    getActiveTabState,
    goToUrl,
  } = useBrowserState();

  const { isDarkMode } = useColorMode();

  const { scrollViewRef, activeTabRef } = useBrowserContext();

  const route = useRoute<RouteProp<RouteParams, 'DappBrowserParams'>>();

  useAnimatedReaction(
    () => route.params?.url,
    (current, previous) => {
      if (current !== previous && route.params?.url) {
        newTabWorklet(current);
      }
    },
    [newTabWorklet, route.params?.url]
  );

  useEffect(() => {
    // Delay prunning screenshots until after the tab states have been updated
    InteractionManager.runAfterInteractions(() => {
      pruneScreenshots(tabStates);
    });
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

  const scrollViewHeightStyle = useAnimatedStyle(() => {
    const height = Math.max(
      Math.ceil((currentlyOpenTabIds?.value.length || 0) / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28,
      deviceUtils.dimensions.height
    );
    // Using paddingBottom on a nested container instead of height because the height of the ScrollView
    // seemingly cannot be directly animated. This works because the tabs are all positioned absolutely.
    return { paddingBottom: withTiming(height, TIMING_CONFIGS.tabPressConfig) };
  });

  const scrollEnabledProp = useAnimatedProps(() => ({
    scrollEnabled: tabViewVisible?.value,
  }));

  return (
    <SheetGestureBlocker preventScrollViewDismissal>
      <Box as={Page} height="full" style={isDarkMode ? styles.rootViewBackground : styles.rootViewBackgroundLight} width="full">
        <Box as={Animated.View} height="full" position="absolute" style={[backgroundStyle]} width="full" />
        <AnimatedScrollView
          animatedProps={scrollEnabledProp}
          ref={scrollViewRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={scrollViewHeightStyle}>
            {tabStates.map((_, index) => (
              <BrowserTab
                key={tabStates[index].uniqueId}
                tabState={tabStates[index]}
                isActiveTab={index === activeTabIndex}
                tabId={tabStates[index].uniqueId}
                tabsCount={tabStates.length}
                activeTabRef={activeTabRef}
                animatedActiveTabIndex={animatedActiveTabIndex}
                closeTabWorklet={closeTabWorklet}
                currentlyOpenTabIds={currentlyOpenTabIds}
                tabViewProgress={tabViewProgress}
                tabViewVisible={tabViewVisible}
                toggleTabViewWorklet={toggleTabViewWorklet}
                updateActiveTabState={index === activeTabIndex ? updateActiveTabState : undefined}
                nextTabId={tabStates?.[1]?.uniqueId}
                goToUrl={url => goToUrl(url, index)}
              />
            ))}
          </Animated.View>
        </AnimatedScrollView>
        <ProgressBar tabViewVisible={tabViewVisible} />
        <TabViewToolbar
          tabViewVisible={tabViewVisible}
          tabViewProgress={tabViewProgress}
          newTabWorklet={newTabWorklet}
          toggleTabViewWorklet={toggleTabViewWorklet}
        />
        <Search
          tabViewVisible={tabViewVisible}
          tabViewProgress={tabViewProgress}
          activeTabIndex={activeTabIndex}
          tabStates={tabStates}
          updateActiveTabState={updateActiveTabState}
          getActiveTabState={getActiveTabState}
          animatedActiveTabIndex={animatedActiveTabIndex}
          toggleTabViewWorklet={toggleTabViewWorklet}
        />
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
