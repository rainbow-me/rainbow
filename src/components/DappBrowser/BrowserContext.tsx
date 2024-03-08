/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Animated, { Easing, runOnJS, useAnimatedRef, useScrollViewOffset, useSharedValue, withTiming } from 'react-native-reanimated';
import WebView from 'react-native-webview';
import isEqual from 'react-fast-compare';

interface BrowserContextType {
  activeTabIndex: number;
  closeTab: (tabIndex: number) => void;
  goBack: () => void;
  goForward: () => void;
  isBrowserInputFocused: boolean;
  newTab: () => void;
  onRefresh: () => void;
  scrollViewOffset: Animated.SharedValue<number> | undefined;
  scrollViewRef: React.MutableRefObject<Animated.ScrollView | null>;
  setActiveTabIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsBrowserInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  tabStates: TabState[];
  tabViewProgress: Animated.SharedValue<number> | undefined;
  tabViewFullyVisible: boolean;
  tabViewVisible: boolean;
  toggleTabView: () => void;
  updateActiveTabState: (tabIndex: number, newState: Partial<TabState>) => void;
  webViewRefs: React.MutableRefObject<(WebView | null)[]>;
}

interface TabState {
  canGoBack: boolean;
  canGoForward: boolean;
  url: string;
}

const defaultContext: BrowserContextType = {
  activeTabIndex: 0,
  closeTab: () => {
    return;
  },
  goBack: () => {
    return;
  },
  goForward: () => {
    return;
  },
  isBrowserInputFocused: false,
  newTab: () => {
    return;
  },
  tabViewProgress: undefined,
  onRefresh: () => {
    return;
  },
  scrollViewOffset: undefined,
  scrollViewRef: { current: null },
  setActiveTabIndex: () => {
    return;
  },
  setIsBrowserInputFocused: () => {
    return;
  },
  tabStates: [
    { url: 'https://www.google.com/', canGoBack: false, canGoForward: false },
    {
      url: 'https://www.rainbowkit.com/',
      canGoBack: false,
      canGoForward: false,
    },
    { url: 'https://app.uniswap.org/', canGoBack: false, canGoForward: false },
  ],
  tabViewFullyVisible: false,
  tabViewVisible: false,
  toggleTabView: () => {
    return;
  },
  updateActiveTabState: () => {
    return;
  },
  webViewRefs: { current: [] },
};

const BrowserContext = createContext<BrowserContextType>(defaultContext);

export const useBrowserContext = () => useContext(BrowserContext);

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

// this is sloppy and causes tons of rerenders, needs to be reworked
export const BrowserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isBrowserInputFocused, setIsBrowserInputFocused] = useState<boolean>(false);
  const [tabStates, setTabStates] = useState<TabState[]>(defaultContext.tabStates);
  const [tabViewFullyVisible, setTabViewFullyVisible] = useState(false);
  const [tabViewVisible, setTabViewVisible] = useState(false);

  const updateActiveTabState = useCallback(
    (tabIndex: number, newState: Partial<TabState>) => {
      if (isEqual(tabStates[tabIndex], newState)) return;
      setTabStates(prevTabStates => {
        const updatedTabs = [...prevTabStates];
        updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...newState };
        return updatedTabs;
      });
    },
    [tabStates]
  );

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const webViewRefs = useRef<WebView[]>([]);

  const scrollViewOffset = useScrollViewOffset(scrollViewRef);
  const tabViewProgress = useSharedValue(0);

  const toggleTabView = useCallback(() => {
    const isVisible = !tabViewVisible;
    tabViewProgress.value = isVisible
      ? withTiming(1, timingConfig, isFinished => {
          if (isFinished) {
            runOnJS(setTabViewFullyVisible)(true);
          }
        })
      : withTiming(0, timingConfig);

    setTabViewVisible(isVisible);
    if (!isVisible) {
      setTabViewFullyVisible(false);
    }
  }, [tabViewProgress, tabViewVisible]);

  const closeTab = useCallback(
    (tabIndex: number) => {
      setTabStates(prevTabStates => {
        const updatedTabs = [...prevTabStates];
        if (tabIndex === activeTabIndex) {
          if (tabIndex < updatedTabs.length - 1) {
            setActiveTabIndex(tabIndex);
          } else if (tabIndex > 0) {
            setActiveTabIndex(tabIndex - 1);
          }
        }
        updatedTabs.splice(tabIndex, 1);
        webViewRefs.current.splice(tabIndex, 1);
        return updatedTabs;
      });
    },
    [activeTabIndex, setActiveTabIndex, setTabStates, webViewRefs]
  );

  const newTab = useCallback(() => {
    setActiveTabIndex(tabStates.length);
    setTabStates(prevTabStates => {
      const updatedTabs = [...prevTabStates];
      updatedTabs.push({
        canGoBack: false,
        canGoForward: false,
        url: 'https://www.google.com',
      });
      return updatedTabs;
    });
    toggleTabView();
  }, [setTabStates, tabStates.length, toggleTabView]);

  const goBack = useCallback(() => {
    const activeWebview = webViewRefs.current[activeTabIndex];
    if (activeWebview && tabStates[activeTabIndex].canGoBack) {
      activeWebview.goBack();
    }
  }, [activeTabIndex, tabStates, webViewRefs]);

  const goForward = useCallback(() => {
    const activeWebview = webViewRefs.current[activeTabIndex];
    if (activeWebview && tabStates[activeTabIndex].canGoForward) {
      activeWebview.goForward();
    }
  }, [activeTabIndex, tabStates, webViewRefs]);

  const onRefresh = useCallback(() => {
    const activeWebview = webViewRefs.current[activeTabIndex];
    if (activeWebview) {
      activeWebview.reload();
    }
  }, [activeTabIndex, webViewRefs]);

  return (
    <BrowserContext.Provider
      value={{
        activeTabIndex,
        closeTab,
        goBack,
        goForward,
        isBrowserInputFocused,
        newTab,
        onRefresh,
        setActiveTabIndex,
        setIsBrowserInputFocused,
        scrollViewOffset,
        scrollViewRef,
        tabStates,
        tabViewProgress,
        tabViewFullyVisible,
        tabViewVisible,
        toggleTabView,
        updateActiveTabState,
        webViewRefs,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
