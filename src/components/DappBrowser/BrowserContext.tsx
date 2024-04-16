import React, { createContext, useCallback, useContext, useRef } from 'react';
import Animated, { AnimatedRef, SharedValue, useAnimatedRef, useScrollViewOffset, useSharedValue } from 'react-native-reanimated';
import WebView from 'react-native-webview';

interface BrowserTabViewProgressContextType {
  tabViewProgress: SharedValue<number> | undefined;
}

const DEFAULT_PROGRESS_CONTEXT = {
  tabViewProgress: undefined,
};

const BrowserTabViewProgressContext = createContext<BrowserTabViewProgressContextType>(DEFAULT_PROGRESS_CONTEXT);

export const useBrowserTabViewProgressContext = () => useContext(BrowserTabViewProgressContext);

export const BrowserTabViewProgressContextProvider = ({ children }: { children: React.ReactNode }) => {
  const tabViewProgress = useSharedValue(0);

  return <BrowserTabViewProgressContext.Provider value={{ tabViewProgress }}>{children}</BrowserTabViewProgressContext.Provider>;
};

interface BrowserContextType {
  loadProgress: SharedValue<number> | undefined;
  searchViewProgress: SharedValue<number> | undefined;
  scrollViewOffset: SharedValue<number> | undefined;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  goBack: () => void;
  goForward: () => void;
  onRefresh: () => void;
  activeTabRef: React.MutableRefObject<WebView | null>;
}

const DEFAULT_BROWSER_CONTEXT: BrowserContextType = {
  loadProgress: undefined,
  searchViewProgress: undefined,
  scrollViewOffset: undefined,
  // @ts-expect-error Explicitly allowing null/undefined on the AnimatedRef causes type issues
  scrollViewRef: { current: null },
  activeTabRef: { current: null },
  goBack: () => {},
  goForward: () => {},
  onRefresh: () => {},
};

const BrowserContext = createContext<BrowserContextType>(DEFAULT_BROWSER_CONTEXT);

export const useBrowserContext = () => useContext(BrowserContext);

export const BrowserContextProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('BrowserContextProvider :: RENDER');
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const loadProgress = useSharedValue(0);
  const searchViewProgress = useSharedValue(0);
  const scrollViewOffset = useScrollViewOffset(scrollViewRef);
  const activeTabRef = useRef<WebView | null>(null);

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

  // We use the currentlyOpenTabIds shared value as an always-up-to-date source of truth for which
  // tabs are open at any given moment, inclusive of any pending tab operations. This ensures that
  // a stale version of tabStates is never used when multiple tabs are closed or created quickly.
  // This value is updated in real time when a 'tabClose' or 'newTab' operation initiates.

  return (
    <BrowserContext.Provider
      value={{
        activeTabRef,
        loadProgress,
        searchViewProgress,
        scrollViewOffset,
        scrollViewRef,
        goBack,
        goForward,
        onRefresh,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
