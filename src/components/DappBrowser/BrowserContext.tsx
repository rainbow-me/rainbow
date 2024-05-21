import React, { createContext, useCallback, useContext, useRef } from 'react';
import Animated, {
  AnimatedRef,
  DerivedValue,
  SharedValue,
  interpolate,
  runOnUI,
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView from 'react-native-webview';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, WEBVIEW_HEIGHT } from './Dimensions';
import { BrowserWorkletsContext } from './BrowserWorkletsContext';
import { RAINBOW_HOME } from './constants';
import { AnimatedScreenshotData, AnimatedTabUrls } from './types';
import { normalizeUrlWorklet } from './utils';
import { calculateTabViewBorderRadius } from './utils/layoutUtils';

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

interface ActiveTabRef extends WebView {
  title?: string;
}

interface BrowserContextType {
  activeTabInfo: DerivedValue<{ isGoogleSearch: boolean; isOnHomepage: boolean; tabId: string; url: string }>;
  activeTabRef: React.MutableRefObject<ActiveTabRef | null>;
  animatedActiveTabIndex: SharedValue<number>;
  animatedMultipleTabsOpen: DerivedValue<number>;
  animatedScreenshotData: SharedValue<AnimatedScreenshotData>;
  animatedTabUrls: SharedValue<AnimatedTabUrls>;
  animatedTabViewBorderRadius: SharedValue<number>;
  animatedWebViewHeight: DerivedValue<number>;
  currentlyBeingClosedTabIds: SharedValue<string[]>;
  currentlyOpenTabIds: SharedValue<string[]>;
  loadProgress: SharedValue<number>;
  multipleTabsOpen: DerivedValue<boolean>;
  screenshotCaptureRef: React.MutableRefObject<ViewShot | null>;
  scrollViewOffset: SharedValue<number>;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  searchViewProgress: SharedValue<number>;
  tabViewProgress: SharedValue<number>;
  tabViewVisible: SharedValue<boolean>;
  goBack: () => void;
  goForward: () => void;
  goToUrl: (url: string, tabId?: string) => void;
  refreshPage: () => void;
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
  const animatedScreenshotData = useSharedValue<AnimatedScreenshotData>({});
  const animatedTabUrls = useSharedValue<AnimatedTabUrls>(useBrowserStore.getState().persistedTabUrls);

  // We use the currentlyOpenTabIds shared value as an always-up-to-date source of truth for which tabs
  // are open at any given moment, inclusive of any pending tab operations. This gives us real-time access
  // to the most up-to-date tab layout. It's kept in sync with the zustand store by useSyncSharedValue.
  const currentlyOpenTabIds = useSharedValue(useBrowserStore.getState().tabIds);
  const currentlyBeingClosedTabIds = useSharedValue<string[]>([]);

  const loadProgress = useSharedValue(0);
  const scrollViewOffset = useSharedValue(0);
  const searchViewProgress = useSharedValue(0);
  const tabViewVisible = useSharedValue(false);

  const activeTabRef = useRef<ActiveTabRef | null>(null);
  const screenshotCaptureRef = useRef<ViewShot | null>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const goToPage = useBrowserStore(state => state.goToPage);

  const activeTabInfo = useDerivedValue(() => {
    const activeTabId = currentlyOpenTabIds.value[Math.abs(animatedActiveTabIndex.value)];
    const url = animatedTabUrls.value[activeTabId] || RAINBOW_HOME;
    const isGoogleSearch = url.includes('google.com/search');
    const isOnHomepage = url === RAINBOW_HOME;
    return {
      isGoogleSearch,
      isOnHomepage,
      tabId: activeTabId,
      url,
    };
  });

  const multipleTabsOpen = useDerivedValue(() => currentlyOpenTabIds.value.length > 1);

  const animatedMultipleTabsOpen = useDerivedValue(() => withTiming(multipleTabsOpen.value ? 1 : 0, TIMING_CONFIGS.tabPressConfig));

  const animatedTabViewBorderRadius = useDerivedValue(() => calculateTabViewBorderRadius(animatedMultipleTabsOpen.value));

  const animatedWebViewHeight = useDerivedValue(() =>
    interpolate(tabViewProgress.value, [0, 100], [WEBVIEW_HEIGHT, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED], 'clamp')
  );

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

  const refreshPage = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.reload();
    }
  }, [activeTabRef]);

  const goToUrl = useCallback(
    (url: string, tabId?: string) => {
      if (normalizeUrlWorklet(url) === normalizeUrlWorklet(activeTabInfo.value.url)) {
        refreshPage();
      } else {
        goToPage(url);
      }
      if (workletsContext) {
        runOnUI(workletsContext.updateTabUrlWorklet)(url, tabId);
      }
    },
    [activeTabInfo, goToPage, refreshPage, workletsContext]
  );

  return (
    <BrowserContext.Provider
      value={{
        activeTabInfo,
        activeTabRef,
        animatedActiveTabIndex,
        animatedMultipleTabsOpen,
        animatedScreenshotData,
        animatedTabUrls,
        animatedTabViewBorderRadius,
        animatedWebViewHeight,
        currentlyBeingClosedTabIds,
        currentlyOpenTabIds,
        loadProgress,
        multipleTabsOpen,
        screenshotCaptureRef,
        scrollViewOffset,
        scrollViewRef,
        searchViewProgress,
        tabViewProgress,
        tabViewVisible,
        goBack,
        goForward,
        goToUrl,
        refreshPage,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
