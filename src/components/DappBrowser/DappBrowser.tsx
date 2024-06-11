import React, { useEffect } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { useNavigation } from '@/navigation';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserHistoryStore } from '@/state/browserHistory';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { BrowserTab } from './BrowserTab';
import { BrowserWorkletsContextProvider, useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { ProgressBar } from './ProgressBar';
import { TabViewToolbar } from './TabViewToolbar';
import { BrowserGestureBlocker } from './components/BrowserGestureBlocker';
import { calculateScrollPositionToCenterTab, useScreenshotAndScrollTriggers } from './hooks/useScreenshotAndScrollTriggers';
import { useSmoothScrollView } from './hooks/useSmoothScrollView';
import { pruneScreenshots } from './screenshots';
import { Search } from './search/Search';
import { SearchContextProvider } from './search/SearchContext';

export type DappBrowserParams = {
  url: string;
};

type RouteParams = {
  DappBrowserParams: DappBrowserParams;
};

export const DappBrowser = () => {
  const { isDarkMode } = useColorMode();
  return (
    <BrowserGestureBlocker>
      <Box
        as={Page}
        height="full"
        style={[isDarkMode ? styles.rootViewBackground : styles.rootViewBackgroundLight, styles.overflowHidden]}
        width="full"
      >
        <BrowserContextProvider>
          <BrowserWorkletsContextProvider>
            <DappBrowserComponent />
          </BrowserWorkletsContextProvider>
        </BrowserContextProvider>
      </Box>
    </BrowserGestureBlocker>
  );
};

const DappBrowserComponent = () => {
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
};

const NewTabTrigger = () => {
  const { newTabWorklet } = useBrowserWorkletsContext();
  const route = useRoute<RouteProp<RouteParams, 'DappBrowserParams'>>();
  const { goToUrl } = useBrowserContext();
  const { setParams } = useNavigation();

  useAnimatedReaction(
    () => route.params?.url,
    (current, previous) => {
      if (current !== previous && route.params?.url) {
        newTabWorklet(current);
      }
    },
    [newTabWorklet, route.params?.url]
  );

  // TODO: make newTabWorklet work without this.
  // In the meantime, this is am ugly hack for opening a new tab with a URL
  useEffect(() => {
    if (route.params?.url) {
      setTimeout(() => {
        goToUrl(route.params?.url);
        setParams({ url: undefined });
      }, 300);
    }
  }, [goToUrl, route.params?.url, setParams]);

  return null;
};

function useScreenshotPruner() {
  useEffect(() => {
    // Delay pruning screenshots until after the tab states have been updated
    InteractionManager.runAfterInteractions(() => {
      pruneScreenshots(useBrowserStore.getState().tabsData);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line no-nested-ternary
        [isDarkMode ? globalColors.grey100 : IS_ANDROID ? '#F2F2F5' : '#FBFCFD', isDarkMode ? '#0A0A0A' : '#F2F2F5']
      ),
    };
  });

  return <Animated.View style={[backgroundStyle, styles.tabViewBackground]} />;
};

const TabViewScrollView = ({ children }: { children: React.ReactNode }) => {
  const { animatedActiveTabIndex, currentlyOpenTabIds, scrollViewRef, tabViewVisible } = useBrowserContext();
  const { jitterCorrection, scrollViewHeight, smoothScrollHandler } = useSmoothScrollView();

  const scrollEnabledProp = useAnimatedProps(() => ({
    scrollEnabled: tabViewVisible.value,
  }));

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: 0,
      y: calculateScrollPositionToCenterTab(animatedActiveTabIndex.value, currentlyOpenTabIds.value.length),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.ScrollView
      animatedProps={scrollEnabledProp}
      onScroll={smoothScrollHandler}
      pinchGestureEnabled={false}
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      testID={'browser-screen'}
    >
      <Animated.View style={[styles.scrollViewHeight, { height: scrollViewHeight, transform: [{ translateY: jitterCorrection }] }]}>
        {children}
      </Animated.View>
    </Animated.ScrollView>
  );
};

const TabViewContent = () => {
  const { currentlyBeingClosedTabIds, currentlyOpenTabIds } = useBrowserContext();

  const tabIds = useBrowserStore(state => state.tabIds);
  const addRecent = useBrowserHistoryStore(state => state.addRecent);
  const setLogo = useBrowserStore(state => state.setLogo);
  const setTabIds = useBrowserStore(state => state.setTabIds);
  const setTitle = useBrowserStore(state => state.setTitle);

  const areTabCloseAnimationsRunning = useDerivedValue(() => currentlyBeingClosedTabIds.value.length > 0);

  useSyncSharedValue({
    pauseSync: areTabCloseAnimationsRunning,
    setState: setTabIds,
    sharedValue: currentlyOpenTabIds,
    state: tabIds,
    syncDirection: 'sharedValueToState',
  });

  return (
    <>
      {tabIds.map(tabId => (
        <BrowserTab addRecent={addRecent} key={tabId} setLogo={setLogo} setTitle={setTitle} tabId={tabId} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  overflowHidden: {
    overflow: 'hidden',
  },
  rootViewBackground: {
    backgroundColor: globalColors.grey100,
    flex: 1,
  },
  rootViewBackgroundLight: {
    backgroundColor: '#FBFCFD',
    flex: 1,
  },
  scrollViewHeight: {
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
