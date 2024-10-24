import React, { createContext, useCallback, useContext, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, GestureResponderEvent } from 'react-native';
import Animated, {
  AnimatedRef,
  DerivedValue,
  SharedValue,
  interpolate,
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
import WebView from 'react-native-webview';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import Routes from '@/navigation/routesNames';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useFreezeStore } from '@/state/freezeStore/freezeStore';
import { clamp } from '@/__swaps__/utils/swaps';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  EXTRA_WEBVIEW_HEIGHT,
  GROW_WEBVIEW_THRESHOLD,
  SHRINK_WEBVIEW_THRESHOLD,
  WEBVIEW_HEIGHT,
} from './Dimensions';
import { RAINBOW_HOME } from './constants';
import { AnimatedScreenshotData, AnimatedTabUrls } from './types';
import { normalizeUrlWorklet } from './utils';
import { calculateTabViewBorderRadius } from './utils/layoutUtils';

interface BrowserTabBarContextType {
  activeTabRef: React.MutableRefObject<ActiveTabRef | null>;
  extraWebViewHeight: DerivedValue<number>;
  shouldCollapseBottomBar: SharedValue<boolean>;
  tabViewProgress: SharedValue<number>;
  goBack: () => void;
  goForward: () => void;
}

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
    if (activeTabRef.current) {
      activeTabRef.current.goBack();
    }
  }, [activeTabRef]);

  const goForward = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.goForward();
    }
  }, [activeTabRef]);

  return (
    <BrowserTabBarContext.Provider
      value={{ activeTabRef, extraWebViewHeight, goBack, goForward, shouldCollapseBottomBar, tabViewProgress }}
    >
      {children}
    </BrowserTabBarContext.Provider>
  );
};

interface ActiveTabRef extends WebView {
  title?: string;
}

export enum TabViewGestureStates {
  ACTIVE = 'ACTIVE',
  DRAG_END_ENTERING = 'DRAG_END_ENTERING',
  DRAG_END_EXITING = 'DRAG_END_EXITING',
  INACTIVE = 'INACTIVE',
}

interface WebViewScrollEvent extends Omit<NativeScrollEvent, 'zoomScale'> {
  zoomScale?: number;
}

interface BrowserContextType {
  activeTabId: SharedValue<string>;
  activeTabInfo: DerivedValue<{ isGoogleSearch: boolean; isOnHomepage: boolean; tabId: string; tabIndex: number; url: string }>;
  activeTabRef: React.MutableRefObject<ActiveTabRef | null>;
  animatedActiveTabIndex: SharedValue<number>;
  animatedMultipleTabsOpen: DerivedValue<number>;
  animatedScreenshotData: SharedValue<AnimatedScreenshotData>;
  animatedTabUrls: SharedValue<AnimatedTabUrls>;
  animatedTabViewBorderRadius: SharedValue<number>;
  animatedWebViewHeight: DerivedValue<number>;
  currentlyBeingClosedTabIds: SharedValue<string[]>;
  currentlyOpenTabIds: SharedValue<string[]>;
  extraWebViewHeight: DerivedValue<number>;
  isSwitchingTabs: DerivedValue<boolean>;
  lastActiveHomepageTab: SharedValue<string | null>;
  loadProgress: SharedValue<number>;
  multipleTabsOpen: DerivedValue<boolean>;
  pendingTabSwitchOffset: SharedValue<number>;
  screenshotCaptureRef: React.MutableRefObject<ViewShot | null>;
  scrollViewOffset: SharedValue<number>;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  searchViewProgress: SharedValue<number>;
  shouldCollapseBottomBar: SharedValue<boolean>;
  shouldToggleAfterTabSwitch: SharedValue<boolean | number>;
  tabSwitchGestureX: SharedValue<number>;
  tabViewGestureHoldDuration: SharedValue<number>;
  tabViewGestureProgress: SharedValue<number>;
  tabViewGestureState: SharedValue<TabViewGestureStates>;
  tabViewProgress: SharedValue<number>;
  tabViewVisible: SharedValue<boolean>;
  goBack: () => void;
  goForward: () => void;
  goToUrl: (url: string, tabId?: string) => void;
  onScrollWebView: (event: NativeSyntheticEvent<WebViewScrollEvent>) => void;
  onTouchEnd: (event: GestureResponderEvent) => void;
  onTouchMove: (event: GestureResponderEvent) => void;
  onTouchStart: (event: GestureResponderEvent) => void;
  refreshPage: () => void;
  resetScrollHandlers: () => void;
  stopLoading: () => void;
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
  const { activeTabRef, extraWebViewHeight, goBack, goForward, shouldCollapseBottomBar, tabViewProgress } = useBrowserTabBarContext();

  const activeTabId = useSharedValue(useBrowserStore.getState().getActiveTabId());
  const animatedActiveTabIndex = useSharedValue(useBrowserStore.getState().activeTabIndex);
  const animatedScreenshotData = useSharedValue<AnimatedScreenshotData>({});
  const animatedTabUrls = useSharedValue<AnimatedTabUrls>(useBrowserStore.getState().persistedTabUrls);

  // We use the currentlyOpenTabIds shared value as an always-up-to-date source of truth for which tabs
  // are open at any given moment, inclusive of any pending tab operations. This gives us real-time access
  // to the most up-to-date tab layout. It's kept in sync with the zustand store by useSyncSharedValue.
  const currentlyOpenTabIds = useSharedValue(useBrowserStore.getState().tabIds);
  const currentlyBeingClosedTabIds = useSharedValue<string[]>([]);

  const lastActiveHomepageTab = useSharedValue<string | null>(useBrowserStore.getState().isOnHomepage() ? activeTabId.value : null);
  const loadProgress = useSharedValue(0);
  const pendingTabSwitchOffset = useSharedValue(0);
  const scrollViewOffset = useSharedValue(0);
  const searchViewProgress = useSharedValue(0);
  const shouldToggleAfterTabSwitch = useSharedValue<boolean | number>(false);
  const tabSwitchGestureX = useSharedValue(0);
  const tabViewGestureHoldDuration = useSharedValue(0);
  const tabViewGestureProgress = useSharedValue(0);
  const tabViewGestureState = useSharedValue(TabViewGestureStates.INACTIVE);
  const tabViewVisible = useSharedValue(false);

  const scrollPositionRef = useRef<number | undefined>(undefined);
  const startScrollPositionRef = useRef<number | undefined>(undefined);
  const screenshotCaptureRef = useRef<ViewShot | null>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const touchPositionYRef = useRef<number | undefined>(undefined);

  const activeSwipeRoute = useFreezeStore(state => state.animatedActiveSwipeRoute);
  const goToPage = useBrowserStore(state => state.goToPage);
  const setShouldExpandWebView = useBrowserStore(state => state.setShouldExpandWebView);

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
      tabId: activeTabId.value,
      tabIndex: Math.abs(animatedActiveTabIndex.value),
      url,
    };
  });

  const isSwitchingTabs = useDerivedValue(() => tabViewGestureState.value !== TabViewGestureStates.INACTIVE);

  const multipleTabsOpen = useDerivedValue(() => currentlyOpenTabIds.value.length > 1);

  const animatedMultipleTabsOpen = useDerivedValue<number>(() => withTiming(multipleTabsOpen.value ? 1 : 0, TIMING_CONFIGS.tabPressConfig));

  const animatedTabViewBorderRadius = useDerivedValue(() => calculateTabViewBorderRadius(animatedMultipleTabsOpen.value));

  const animatedWebViewHeight = useDerivedValue(() => {
    const fullHeight = WEBVIEW_HEIGHT + extraWebViewHeight.value;
    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;
    const forceFullHeight = isSwitchingTabs.value && !isRunningEnterTabViewAnimation;

    return interpolate(
      tabViewProgress.value,
      [0, 100],
      [fullHeight, forceFullHeight ? fullHeight : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED],
      'clamp'
    );
  });

  const shouldExpandWebView = useDerivedValue(() => {
    return shouldCollapseBottomBar.value || (!shouldCollapseBottomBar.value && extraWebViewHeight.value > 0);
  });

  const refreshPage = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.reload();
    }
  }, [activeTabRef]);

  const stopLoading = useCallback(() => {
    if (activeTabRef.current) {
      activeTabRef.current.stopLoading();
    }
  }, [activeTabRef]);

  const goToUrl = useCallback(
    (url: string, tabId?: string) => {
      const { url: activeTabUrl, tabId: activeTabId } = activeTabInfo.value;
      const tabIdToUse = tabId || activeTabId;

      if (normalizeUrlWorklet(url) === normalizeUrlWorklet(activeTabUrl)) {
        refreshPage();
      } else {
        goToPage(url, tabIdToUse);
      }

      runOnUI(() => {
        'worklet';
        const tabIdToUse = tabId || activeTabId;
        animatedTabUrls.modify(urls => ({ ...urls, [tabIdToUse]: normalizeUrlWorklet(url) }));
      })();
    },
    [activeTabInfo, animatedTabUrls, goToPage, refreshPage]
  );

  const onScrollWebView = useCallback(
    (event: NativeSyntheticEvent<WebViewScrollEvent>) => {
      const previousScrollY = scrollPositionRef.current;
      const scrollY = event.nativeEvent.contentOffset.y;

      scrollPositionRef.current = scrollY;

      const contentHeight = event.nativeEvent.contentSize.height;
      if (contentHeight < WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT) {
        shouldCollapseBottomBar.value = false;
        return;
      }

      if (startScrollPositionRef.current === undefined) return;
      if (startScrollPositionRef.current > contentHeight) {
        startScrollPositionRef.current = contentHeight;
      }

      const clampedScrollY = clamp(scrollY, 0, contentHeight);
      const scrollDelta = clampedScrollY - startScrollPositionRef.current;
      const isScrollingUp = scrollY - startScrollPositionRef.current < 0;
      const didScrollToTop = clampedScrollY === 0 && previousScrollY !== undefined && previousScrollY > 0;

      if (scrollDelta > GROW_WEBVIEW_THRESHOLD) {
        shouldCollapseBottomBar.value = true;
      } else if (scrollDelta < -SHRINK_WEBVIEW_THRESHOLD || (scrollY < 0 && isScrollingUp) || didScrollToTop) {
        shouldCollapseBottomBar.value = false;
      }
    },
    [shouldCollapseBottomBar]
  );

  const onTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const isScrollingUp = touchPositionYRef.current && event.nativeEvent.pageY > touchPositionYRef.current;

      if (isScrollingUp && (scrollPositionRef.current === 0 || scrollPositionRef.current === undefined)) {
        shouldCollapseBottomBar.value = false;
      }

      touchPositionYRef.current = undefined;
    },
    [shouldCollapseBottomBar]
  );

  const onTouchMove = useCallback((event: GestureResponderEvent) => {
    const isScrollingUp = touchPositionYRef.current && event.nativeEvent.pageY > touchPositionYRef.current;
    touchPositionYRef.current = isScrollingUp ? event.nativeEvent.pageY - 1 : event.nativeEvent.pageY;

    if (startScrollPositionRef.current === undefined && scrollPositionRef.current !== undefined) {
      startScrollPositionRef.current = Math.max(0, scrollPositionRef.current);
    }
  }, []);

  const onTouchStart = useCallback(() => {
    if (scrollPositionRef.current !== undefined) {
      startScrollPositionRef.current = Math.max(0, scrollPositionRef.current);
    }
  }, []);

  const resetScrollHandlers = useCallback(() => {
    startScrollPositionRef.current = undefined;
    scrollPositionRef.current = undefined;
    touchPositionYRef.current = undefined;
  }, []);

  useAnimatedReaction(
    () => shouldExpandWebView.value,
    (current, prev) => {
      if (!prev && current) {
        runOnJS(setShouldExpandWebView)(true);
      } else if (prev && !current) {
        runOnJS(setShouldExpandWebView)(false);
      }
    },
    []
  );

  useAnimatedReaction(
    () => ({ isOnBrowserTab: activeSwipeRoute.value === Routes.DAPP_BROWSER_SCREEN }),
    (current, prev) => {
      const resetForInactiveBrowserTab = !current.isOnBrowserTab && prev?.isOnBrowserTab && shouldCollapseBottomBar.value;
      if (resetForInactiveBrowserTab) {
        shouldCollapseBottomBar.value = false;
      }
    },
    []
  );

  useAnimatedReaction(
    () => ({
      activeHomepageId: activeTabInfo.value.isOnHomepage ? activeTabId.value : null,
      tabSwitchGestureX: tabSwitchGestureX.value,
      tabViewProgress: tabViewProgress.value,
    }),
    (current, previous) => {
      if (!previous || !current.activeHomepageId || current.activeHomepageId === lastActiveHomepageTab.value || tabViewVisible.value)
        return;

      const didCloseTab =
        current.tabSwitchGestureX === 0 &&
        previous.tabSwitchGestureX === 0 &&
        current.tabViewProgress === 0 &&
        previous.tabViewProgress === 0;

      const didFinishSwitchingTabs =
        previous && current.tabSwitchGestureX === 0 && previous.tabSwitchGestureX !== 0 && current.tabViewProgress <= 1;

      const exitTabViewAnimationIsComplete =
        previous && !tabViewVisible.value && current.tabViewProgress <= 2 && previous.tabViewProgress > 2;

      if (didCloseTab || didFinishSwitchingTabs || exitTabViewAnimationIsComplete) {
        lastActiveHomepageTab.value = current.activeHomepageId;
      }
    },
    []
  );

  return (
    <BrowserContext.Provider
      value={{
        activeTabId,
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
        extraWebViewHeight,
        isSwitchingTabs,
        lastActiveHomepageTab,
        loadProgress,
        multipleTabsOpen,
        pendingTabSwitchOffset,
        screenshotCaptureRef,
        scrollViewOffset,
        scrollViewRef,
        searchViewProgress,
        shouldCollapseBottomBar,
        shouldToggleAfterTabSwitch,
        tabSwitchGestureX,
        tabViewGestureHoldDuration,
        tabViewGestureProgress,
        tabViewGestureState,
        tabViewProgress,
        tabViewVisible,
        goBack,
        goForward,
        goToUrl,
        onScrollWebView,
        onTouchEnd,
        onTouchMove,
        onTouchStart,
        refreshPage,
        resetScrollHandlers,
        stopLoading,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
