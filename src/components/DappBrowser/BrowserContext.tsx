import React, { createContext, useCallback, useContext, useRef } from 'react';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import Routes from '@/navigation/routesNames';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { EXTRA_WEBVIEW_HEIGHT } from './Dimensions';
import { RAINBOW_HOME } from './constants';
import { useGestureManager } from './hooks/useGestureManager';
import { ActiveTabRef, AnimatedScreenshotData, AnimatedTabUrls, BrowserContextType, BrowserTabBarContextType } from './types';
import { normalizeUrlWorklet } from './utils';
import { calculateTabViewBorderRadius } from './utils/layoutUtils';

const BrowserTabBarContext = createContext<BrowserTabBarContextType | undefined>(undefined);

export const useBrowserTabBarContext = () => {
  const context = useContext(BrowserTabBarContext);
  if (!context) {
    throw new Error('useBrowserTabBarContext must be used within DappBrowser');
  }
  return context;
};

export const BrowserTabBarContextProvider = ({ children }: { children: React.ReactNode }) => {
  const shouldCollapseBottomBar = useSharedValue(false);
  const tabViewProgress = useSharedValue(0);

  const activeTabRef = useRef<ActiveTabRef | null>(null);

  const extraWebViewHeight = useDerivedValue<number>(() =>
    withSpring(shouldCollapseBottomBar.value ? EXTRA_WEBVIEW_HEIGHT : 0, SPRING_CONFIGS.snappySpringConfig)
  );

  const goBack = useCallback(() => {
    activeTabRef.current?.goBack();
  }, [activeTabRef]);

  const goForward = useCallback(() => {
    activeTabRef.current?.goForward();
  }, [activeTabRef]);

  return (
    <BrowserTabBarContext.Provider
      value={{ activeTabRef, extraWebViewHeight, goBack, goForward, shouldCollapseBottomBar, tabViewProgress }}
    >
      {children}
    </BrowserTabBarContext.Provider>
  );
};

const BrowserContext = createContext<BrowserContextType | undefined>(undefined);

export const useBrowserContext = () => {
  const context = useContext(BrowserContext);
  if (!context) {
    throw new Error('useBrowserContext must be used within DappBrowser');
  }
  return context;
};

export const BrowserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeTabRef, extraWebViewHeight, goBack, goForward, shouldCollapseBottomBar, tabViewProgress } = useBrowserTabBarContext();

  const activeTabId = useSharedValue(useBrowserStore.getState().getActiveTabId());
  const animatedActiveSwipeRoute = useNavigationStore(state => state.animatedActiveSwipeRoute);
  const animatedActiveTabIndex = useSharedValue(useBrowserStore.getState().activeTabIndex);
  const animatedScreenshotData = useSharedValue<AnimatedScreenshotData>({});
  const animatedTabUrls = useSharedValue<AnimatedTabUrls>(useBrowserStore.getState().persistedTabUrls);

  // We use the currentlyOpenTabIds shared value as an always-up-to-date source of truth for which tabs
  // are open at any given moment, inclusive of any pending tab operations. This gives us real-time access
  // to the most up-to-date tab layout. It's kept in sync with the zustand store by useSyncSharedValue.
  const currentlyOpenTabIds = useSharedValue(useBrowserStore.getState().tabIds);
  const currentlyBeingClosedTabIds = useSharedValue<string[]>([]);

  const lastActiveHomepageTab = useSharedValue<string | null>(
    useBrowserStore.getState().isOnHomepage() ? useBrowserStore.getState().getActiveTabId() : null
  );
  const loadProgress = useSharedValue(0);
  const scrollViewOffset = useSharedValue(0);
  const searchViewProgress = useSharedValue(0);
  const tabViewVisible = useSharedValue(false);

  const screenshotCaptureRef = useRef<ViewShot | null>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const goToPage = useBrowserStore(state => state.goToPage);

  useAnimatedReaction(
    () => currentlyOpenTabIds.value[animatedActiveTabIndex.value],
    (currentId, prevId) => {
      if ((prevId !== null || currentId !== activeTabId.value) && currentId) {
        if (currentId !== activeTabId.value || (animatedTabUrls.value[currentId] || RAINBOW_HOME) === RAINBOW_HOME) {
          shouldCollapseBottomBar.value = false;
        }
        activeTabId.value = currentId;
        loadProgress.value = 0;
      }
    },
    []
  );

  const activeTabInfo: BrowserContextType['activeTabInfo'] = useDerivedValue(() => {
    const url = animatedTabUrls.value[activeTabId.value] || RAINBOW_HOME;
    const isGoogleSearch = url.includes('google.com/search');
    const isOnHomepage = url === RAINBOW_HOME;
    return {
      isGoogleSearch,
      isOnHomepage,
      tabIndex: Math.abs(animatedActiveTabIndex.value),
      url,
    };
  });

  const GestureManager = useGestureManager({
    activeTabId,
    activeTabInfo,
    extraWebViewHeight,
    lastActiveHomepageTab,
    shouldCollapseBottomBar,
    tabViewProgress,
    tabViewVisible,
  });

  const multipleTabsOpen = useDerivedValue(() => currentlyOpenTabIds.value.length > 1);

  const animatedMultipleTabsOpen = useDerivedValue<number>(() => withTiming(multipleTabsOpen.value ? 1 : 0, TIMING_CONFIGS.tabPressConfig));

  const tabViewBorderRadius = useDerivedValue(() => calculateTabViewBorderRadius(animatedMultipleTabsOpen.value));

  const refreshPage = useCallback(() => {
    activeTabRef.current?.reload();
  }, [activeTabRef]);

  const stopLoading = useCallback(() => {
    activeTabRef.current?.stopLoading();
  }, [activeTabRef]);

  const goToUrl = useCallback(
    (url: string, tabId?: string) => {
      const { url: activeTabUrl } = activeTabInfo.value;
      const tabIdToUse = tabId || activeTabId.value;

      if (normalizeUrlWorklet(url) === normalizeUrlWorklet(activeTabUrl)) {
        refreshPage();
      } else {
        goToPage(url, tabIdToUse);
      }

      runOnUI(() => {
        const tabIdToUse = tabId || activeTabId.value;
        animatedTabUrls.modify(urls => ({ ...urls, [tabIdToUse]: normalizeUrlWorklet(url) }));
      })();
    },
    [activeTabId, activeTabInfo, animatedTabUrls, goToPage, refreshPage]
  );

  const setWebViewHandlersEnabled = useCallback(
    (enabled: boolean) => {
      activeTabRef.current?.setActive(enabled);
    },
    [activeTabRef]
  );

  // Enables or disables WebView JS handlers when navigating to or away from the browser
  // tab, and ensures the tab bar is always revealed when leaving the browser tab
  useAnimatedReaction(
    () => animatedActiveSwipeRoute.value === Routes.DAPP_BROWSER_SCREEN,
    (isOnBrowserTab, prev) => {
      if (activeTabInfo.value.isOnHomepage) return;

      const browserBecameActive = isOnBrowserTab && prev === false;
      const browserBecameInactive = !isOnBrowserTab && prev;

      if (browserBecameActive) {
        runOnJS(setWebViewHandlersEnabled)(true);
      } else if (browserBecameInactive) {
        runOnJS(setWebViewHandlersEnabled)(false);
        if (shouldCollapseBottomBar.value) shouldCollapseBottomBar.value = false;
      }
    },
    []
  );

  return (
    <BrowserContext.Provider
      value={{
        ...GestureManager,
        activeTabId,
        activeTabInfo,
        activeTabRef,
        animatedActiveTabIndex,
        animatedMultipleTabsOpen,
        animatedScreenshotData,
        animatedTabUrls,
        currentlyBeingClosedTabIds,
        currentlyOpenTabIds,
        lastActiveHomepageTab,
        loadProgress,
        multipleTabsOpen,
        screenshotCaptureRef,
        scrollViewOffset,
        scrollViewRef,
        searchViewProgress,
        tabViewBorderRadius,
        tabViewProgress,
        tabViewVisible,
        goBack,
        goForward,
        goToUrl,
        refreshPage,
        stopLoading,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
