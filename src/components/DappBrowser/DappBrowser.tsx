import React, { useEffect, useRef } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import RNFS from 'react-native-fs';

import { Page } from '@/components/layout';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { BrowserTab } from './BrowserTab';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';
import { Search } from './search/Search';
import { TabViewToolbar } from './TabViewToolbar';
import { ProgressBar } from './ProgressBar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TIMING_CONFIGS } from '../animations/animationConfigs';
import { BrowserWorkletsContextProvider, useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { pruneScreenshots } from './screenshots';
import { BrowserGestureBlocker } from './components/BrowserGestureBlocker';
import { useBrowserHistoryStore } from '@/state/browserHistory';
import { useBrowserStore } from '@/state/browser/browserStore';

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
  const { newTabWorklet } = useBrowserWorkletsContext();

  const injectedJS = useRef('');
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
    const loadInjectedJS = async () => {
      try {
        injectedJS.current = await getInjectedJS();
      } catch (e) {
        console.log('error', e);
      }
    };
    loadInjectedJS();
  }, []);

  useEffect(() => {
    // Delay pruning screenshots until after the tab states have been updated
    InteractionManager.runAfterInteractions(() => {
      pruneScreenshots(useBrowserStore.getState().tabsData);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TabViewBackground />
      <TabViewScrollView>
        <TabViewContent injectedJS={injectedJS} />
      </TabViewScrollView>
      <ProgressBar />
      <TabViewToolbar />
      <Search />
    </>
  );
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

const TabViewBackground = () => {
  const { tabViewProgress } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const backgroundStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress.value;
    return {
      backgroundColor: interpolateColor(
        progress,
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

const TabViewContent = React.memo(function TabViewContent({ injectedJS }: { injectedJS: React.MutableRefObject<string | null> }) {
  const { currentlyBeingClosedTabIds, currentlyOpenTabIds } = useBrowserContext();

  const tabIds = useBrowserStore(state => state.getTabIds());
  const setTabIds = useBrowserStore(state => state.setTabIds);
  const setLogo = useBrowserStore(state => state.setLogo);
  const setTitle = useBrowserStore(state => state.setTitle);
  const addRecent = useBrowserHistoryStore(state => state.addRecent);

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
        <BrowserTab addRecent={addRecent} injectedJS={injectedJS} key={tabId} setLogo={setLogo} setTitle={setTitle} tabId={tabId} />
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
