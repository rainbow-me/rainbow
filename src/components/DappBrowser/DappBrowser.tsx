import React, { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolateColor, runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { setParams } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserHistoryStore } from '@/state/browserHistory';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { time } from '@/utils';
import { generateUniqueId } from '@/worklets/strings';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { BrowserTab } from './BrowserTab';
import { BrowserWorkletsContextProvider, useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { ProgressBar } from './ProgressBar';
import { TabViewToolbar } from './TabViewToolbar';
import {
  BROWSER_BACKGROUND_COLOR_DARK,
  BROWSER_BACKGROUND_COLOR_LIGHT,
  HOMEPAGE_BACKGROUND_COLOR_LIGHT,
  TAB_VIEW_BACKGROUND_COLOR_DARK,
  TAB_VIEW_BACKGROUND_COLOR_LIGHT,
} from './constants';
import { useBrowserScrollView } from './hooks/useBrowserScrollView';
import { useScreenshotAndScrollTriggers } from './hooks/useScreenshotAndScrollTriggers';
import { pruneScreenshots } from './screenshots';
import { Search } from './search/Search';
import { SearchContextProvider } from './search/SearchContext';
import { AnimatedTabUrls, TabId, TabViewGestureStates } from './types';

export const DappBrowser = () => {
  const { isDarkMode } = useColorMode();
  return (
    <Box as={Page} height="full" style={[isDarkMode ? styles.rootViewBackgroundDark : styles.rootViewBackgroundLight]} width="full">
      <BrowserContextProvider>
        <BrowserWorkletsContextProvider>
          <DappBrowserComponent />
        </BrowserWorkletsContextProvider>
      </BrowserContextProvider>
    </Box>
  );
};

const DappBrowserComponent = memo(function DappBrowserComponent() {
  useScreenshotAndScrollTriggers();
  useScreenshotPruner();

  return (
    <>
      <NewTabTrigger />
      <TabViewBackground />
      <TabViewScrollView>
        <TabViewContent />
      </TabViewScrollView>
      <ProgressBar />
      <TabViewToolbar />
      <SearchContextProvider>
        <Search />
      </SearchContextProvider>
    </>
  );
});

const NewTabTrigger = () => {
  const { animatedTabUrls, currentlyOpenTabIds } = useBrowserContext();
  const { newTabWorklet } = useBrowserWorkletsContext();

  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.DAPP_BROWSER_SCREEN>>();
  const newTabUrl = route.params?.url;

  useAnimatedReaction(
    () => newTabUrl,
    (current, previous) => {
      if (current && current !== previous) {
        const newTabId = generateUniqueId();
        const updatedTabUrls = { ...animatedTabUrls.value, [newTabId]: current };
        const newActiveIndex = previous === null ? currentlyOpenTabIds.value.length : undefined;

        runOnJS(setNewTabUrl)(updatedTabUrls, newActiveIndex);
        newTabWorklet({ newTabId, newTabUrl: current });
      }
    },
    [newTabUrl]
  );

  return null;
};

function setNewTabUrl(updatedTabUrls: AnimatedTabUrls, newActiveIndex: number | undefined): void {
  const { setActiveTabIndex, setPersistedTabUrls } = useBrowserStore.getState();
  // Set the new tab URL ahead of creating the tab so the URL is available when the tab is rendered
  setPersistedTabUrls(updatedTabUrls);
  if (newActiveIndex !== undefined) setActiveTabIndex(newActiveIndex);
  setParams<typeof Routes.DAPP_BROWSER_SCREEN>({ url: undefined });
}

function useScreenshotPruner() {
  useEffect(() => {
    let idleCallbackId: number;
    const timeoutId = setTimeout(() => {
      idleCallbackId = requestIdleCallback(() => {
        pruneScreenshots(useBrowserStore.getState().tabsData);
      });
    }, time.seconds(10));

    return () => {
      clearTimeout(timeoutId);
      if (typeof idleCallbackId === 'number') cancelIdleCallback(idleCallbackId);
    };
  }, []);
}

const TabViewBackground = () => {
  const { tabViewProgress } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        tabViewProgress.value,
        [0, 100],
        [
          isDarkMode ? BROWSER_BACKGROUND_COLOR_DARK : BROWSER_BACKGROUND_COLOR_LIGHT,
          isDarkMode ? TAB_VIEW_BACKGROUND_COLOR_DARK : TAB_VIEW_BACKGROUND_COLOR_LIGHT,
        ]
      ),
    };
  });

  return <Animated.View style={[backgroundStyle, styles.tabViewBackground]} />;
};

const TabViewScrollView = ({ children }: { children: React.ReactNode }) => {
  const { scrollViewOffset, scrollViewRef } = useBrowserContext();
  const { animatedProps, gestureManager, gestureManagerStyle, scrollViewContainerStyle, scrollViewStyle } = useBrowserScrollView();

  return (
    <Animated.View style={[styles.scrollViewContainer, gestureManagerStyle]} testID="browser-screen">
      <GestureDetector gesture={gestureManager}>
        <Animated.ScrollView
          animatedProps={animatedProps}
          ref={scrollViewRef}
          scrollViewOffset={scrollViewOffset}
          showsVerticalScrollIndicator={false}
          style={[styles.scrollView, scrollViewContainerStyle]}
        >
          <Animated.View style={[styles.scrollViewHeight, scrollViewStyle]} />
        </Animated.ScrollView>
      </GestureDetector>
      {children}
    </Animated.View>
  );
};

const TabViewContent = () => {
  const { currentlyBeingClosedTabIds, currentlyOpenTabIds, tabViewGestureState } = useBrowserContext();

  const tabIds = useBrowserStore(state => state.tabIds);
  const addRecent = useBrowserHistoryStore(state => state.addRecent);
  const setLogo = useBrowserStore(state => state.setLogo);
  const setTabIds = useBrowserStore(state => state.setTabIds);
  const setTitle = useBrowserStore(state => state.setTitle);

  const renderedTabIds = React.useMemo(() => {
    const seenTabIds = new Set<TabId>();
    return tabIds.filter(tabId => {
      if (!tabId || seenTabIds.has(tabId)) {
        return false;
      }
      seenTabIds.add(tabId);
      return true;
    });
  }, [tabIds]);

  const shouldPauseSync = useDerivedValue(
    () => currentlyBeingClosedTabIds.value.length > 0 || tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING
  );

  useSyncSharedValue({
    pauseSync: shouldPauseSync,
    setState: setTabIds,
    sharedValue: currentlyOpenTabIds,
    state: tabIds,
    syncDirection: 'sharedValueToState',
  });

  return (
    <>
      {renderedTabIds.map(tabId => (
        <BrowserTab addRecent={addRecent} key={tabId} setLogo={setLogo} setTitle={setTitle} tabId={tabId} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  rootViewBackgroundDark: {
    backgroundColor: globalColors.grey100,
    flex: 1,
    position: 'absolute',
  },
  rootViewBackgroundLight: {
    backgroundColor: HOMEPAGE_BACKGROUND_COLOR_LIGHT,
    flex: 1,
    position: 'absolute',
  },
  scrollView: {
    flex: 1,
    height: DEVICE_HEIGHT,
    position: 'absolute',
    width: DEVICE_WIDTH,
    zIndex: 10000,
  },
  scrollViewContainer: {
    height: DEVICE_HEIGHT,
    position: 'absolute',
    width: DEVICE_WIDTH,
  },
  scrollViewHeight: {
    height: DEVICE_HEIGHT,
    pointerEvents: 'box-none',
    width: DEVICE_WIDTH,
  },
  tabViewBackground: {
    height: '100%',
    paddingTop: IS_ANDROID ? 30 : 0,
    position: 'absolute',
    width: '100%',
  },
});
