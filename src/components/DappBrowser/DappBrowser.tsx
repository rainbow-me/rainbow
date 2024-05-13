import React, { useEffect } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserHistoryStore } from '@/state/browserHistory';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { AnimatedScrollView } from '../AnimatedComponents/AnimatedScrollView';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { BrowserTab } from './BrowserTab';
import { BrowserWorkletsContextProvider, useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';
import { ProgressBar } from './ProgressBar';
import { TabViewToolbar } from './TabViewToolbar';
import { BrowserGestureBlocker } from './components/BrowserGestureBlocker';
import { useScreenshotAndScrollTriggers } from './hooks/useScreenshotAndScrollTriggers';
import { pruneScreenshots } from './screenshots';
import { Search } from './search/Search';
import { SearchContextProvider } from './search/SearchContext';
import { useNavigation } from '@/navigation';

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
      <Box as={Page} height="full" style={isDarkMode ? styles.rootViewBackground : styles.rootViewBackgroundLight} width="full">
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
      }, 50);
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
        [isDarkMode ? globalColors.grey100 : '#FBFCFD', isDarkMode ? '#0A0A0A' : '#FBFCFD']
      ),
    };
  });

  return <Animated.View style={[backgroundStyle, styles.tabViewBackground]} />;
};

const TabViewScrollView = ({ children }: { children: React.ReactNode }) => {
  const { currentlyOpenTabIds, scrollViewRef, tabViewVisible } = useBrowserContext();

  const scrollEnabledProp = useAnimatedProps(() => ({
    scrollEnabled: tabViewVisible.value,
  }));

  const scrollViewHeightStyle = useAnimatedStyle(() => {
    const height = Math.max(
      Math.ceil(currentlyOpenTabIds.value.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28 + (IS_ANDROID ? 35 : 0),
      deviceUtils.dimensions.height
    );
    // Using paddingBottom on a nested container instead of height because the height of the ScrollView
    // seemingly cannot be directly animated. This works because the tabs are all positioned absolutely.
    return { paddingBottom: withTiming(height, TIMING_CONFIGS.tabPressConfig) };
  });

  return (
    <AnimatedScrollView animatedProps={scrollEnabledProp} ref={scrollViewRef} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <Animated.View style={scrollViewHeightStyle}>{children}</Animated.View>
    </AnimatedScrollView>
  );
};

const TabViewContent = React.memo(function TabViewContent() {
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
});

const styles = StyleSheet.create({
  rootViewBackground: {
    backgroundColor: globalColors.grey100,
    flex: 1,
  },
  rootViewBackgroundLight: {
    backgroundColor: '#FBFCFD',
    flex: 1,
  },
  tabViewBackground: {
    height: '100%',
    paddingTop: IS_ANDROID ? 30 : 0,
    position: 'absolute',
    width: '100%',
  },
});
