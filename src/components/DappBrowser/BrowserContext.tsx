import React, { createContext, useCallback, useContext, useRef } from 'react';
import Animated, {
  AnimatedRef,
  DerivedValue,
  SharedValue,
  interpolate,
  runOnUI,
  useAnimatedRef,
  useDerivedValue,
  useScrollViewOffset,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import WebView from 'react-native-webview';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { AnimatedTabUrls } from './types';
import { COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, WEBVIEW_HEIGHT } from './Dimensions';
import { BrowserWorkletsContext } from './BrowserWorkletsContext';

interface BrowserTabViewProgressContextType {
  tabViewProgress: SharedValue<number>;
}

const BrowserTabViewProgressContext = createContext<BrowserTabViewProgressContextType | undefined>(undefined);

export const useBrowserTabViewProgressContext = () => {
  const context = useContext(BrowserTabViewProgressContext);
  if (!context) {
    throw new Error('useBrowserTabViewProgressContext must be used within DappBrowser');
  }
  return context;
};

export const BrowserTabViewProgressContextProvider = ({ children }: { children: React.ReactNode }) => {
  const tabViewProgress = useSharedValue(0);

  return <BrowserTabViewProgressContext.Provider value={{ tabViewProgress }}>{children}</BrowserTabViewProgressContext.Provider>;
};

interface BrowserContextType {
  activeTabRef: React.MutableRefObject<WebView | null>;
  animatedActiveTabIndex: SharedValue<number>;
  animatedMultipleTabsOpen: DerivedValue<number>;
  animatedTabUrls: SharedValue<AnimatedTabUrls>;
  animatedWebViewHeight: DerivedValue<number>;
  currentlyBeingClosedTabIds: SharedValue<string[]>;
  currentlyOpenTabIds: SharedValue<string[]>;
  loadProgress: SharedValue<number>;
  multipleTabsOpen: DerivedValue<boolean>;
  scrollViewOffset: SharedValue<number>;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  searchViewProgress: SharedValue<number>;
  tabViewProgress: SharedValue<number>;
  tabViewVisible: SharedValue<boolean>;
  goBack: () => void;
  goForward: () => void;
  goToUrl: (url: string, tabId?: string) => void;
  onRefresh: () => void;
}

const BrowserContext = createContext<BrowserContextType | undefined>(undefined);

export const useBrowserContext = () => {
  const context = useContext(BrowserContext);
  if (!context) {
    throw new Error('useBrowserContext must be used within DappBrowser');
  }
  return context;
};

export const BrowserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { tabViewProgress } = useBrowserTabViewProgressContext();
  const workletsContext = useContext(BrowserWorkletsContext);

  const animatedActiveTabIndex = useSharedValue(useBrowserStore.getState().activeTabIndex);
  const animatedTabUrls = useSharedValue<AnimatedTabUrls>(useBrowserStore.getState().persistedTabUrls);
  const currentlyBeingClosedTabIds = useSharedValue<string[]>([]);

  // We use the currentlyOpenTabIds shared value as an always-up-to-date source of truth for which tabs
  // are open at any given moment, inclusive of any pending tab operations. This gives us real-time access
  // to the most up-to-date tab layout. It's kept in sync with the zustand store by useSyncSharedValue.
  const currentlyOpenTabIds = useSharedValue(useBrowserStore.getState().tabIds);

  const loadProgress = useSharedValue(0);
  const searchViewProgress = useSharedValue(0);
  const tabViewVisible = useSharedValue(false);

  const activeTabRef = useRef<WebView | null>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const scrollViewOffset = useScrollViewOffset(scrollViewRef);

  const goToPage = useBrowserStore(state => state.goToPage);

  const multipleTabsOpen = useDerivedValue(() => {
    return currentlyOpenTabIds.value.length > 1;
  });

  const animatedMultipleTabsOpen = useDerivedValue(() => {
    return withTiming(multipleTabsOpen.value ? 1 : 0, TIMING_CONFIGS.tabPressConfig);
  }, [multipleTabsOpen.value]);

  const animatedWebViewHeight = useDerivedValue(() => {
    return interpolate(tabViewProgress.value, [0, 100], [WEBVIEW_HEIGHT, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED], 'clamp');
  }, [tabViewProgress.value]);

  const goBack = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.goBack();
    }
  }, [activeTabRef]);

  const goForward = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.goForward();
    }
  }, [activeTabRef]);

  const onRefresh = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.reload();
    }
  }, [activeTabRef]);

  const goToUrl = useCallback(
    (url: string, tabId?: string) => {
      goToPage(url);
      if (workletsContext) {
        runOnUI(workletsContext.updateTabUrlWorklet)(url, tabId);
      }
    },
    [goToPage, workletsContext]
  );

  return (
    <BrowserContext.Provider
      value={{
        activeTabRef,
        animatedActiveTabIndex,
        animatedMultipleTabsOpen,
        animatedTabUrls,
        animatedWebViewHeight,
        currentlyBeingClosedTabIds,
        currentlyOpenTabIds,
        loadProgress,
        multipleTabsOpen,
        scrollViewOffset,
        scrollViewRef,
        searchViewProgress,
        tabViewProgress,
        tabViewVisible,
        goBack,
        goForward,
        goToUrl,
        onRefresh,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
