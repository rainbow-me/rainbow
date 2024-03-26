/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Animated, { Easing, runOnJS, useAnimatedRef, useScrollViewOffset, useSharedValue, withTiming } from 'react-native-reanimated';
import WebView from 'react-native-webview';
import isEqual from 'react-fast-compare';
import { InteractionManager, TextInput } from 'react-native';
import { browserStateStore, useBrowserStateStore } from '@/state/browserState';

interface BrowserContextType {
  activeTabIndex: number;
  closeTab: (tabIndex: number) => void;
  goBack: () => void;
  goForward: () => void;
  isSearchInputFocused: boolean;
  newTab: () => void;
  onRefresh: () => void;
  searchInputRef: React.RefObject<TextInput | null>;
  searchViewProgress: Animated.SharedValue<number> | undefined;
  scrollViewOffset: Animated.SharedValue<number> | undefined;
  scrollViewRef: React.MutableRefObject<Animated.ScrollView | null>;
  setActiveTabIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsSearchInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
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

export const RAINBOW_HOME = 'RAINBOW_HOME';

const initialTabs = browserStateStore.getState().tabs;

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
  isSearchInputFocused: false,
  newTab: () => {
    return;
  },
  tabViewProgress: undefined,
  onRefresh: () => {
    return;
  },
  searchInputRef: { current: null },
  searchViewProgress: undefined,
  scrollViewOffset: undefined,
  scrollViewRef: { current: null },
  setActiveTabIndex: () => {
    return;
  },
  setIsSearchInputFocused: () => {
    return;
  },
  tabStates: (initialTabs.length && initialTabs) || [{ url: RAINBOW_HOME, canGoBack: false, canGoForward: false }],
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
  const [isSearchInputFocused, setIsSearchInputFocused] = useState<boolean>(false);
  const [tabStates, setTabStates] = useState<TabState[]>(defaultContext.tabStates);
  const [tabViewFullyVisible, setTabViewFullyVisible] = useState(false);
  const [tabViewVisible, setTabViewVisible] = useState(false);

  const browserStateStore = useBrowserStateStore();

  const updateActiveTabState = useCallback(
    (tabIndex: number, newState: Partial<TabState>) => {
      if (isEqual(tabStates[tabIndex], newState)) return;
      setTabStates(prevTabStates => {
        const updatedTabs = [...prevTabStates];
        updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...newState };
        InteractionManager.runAfterInteractions(() => {
          browserStateStore.updateTab(tabIndex, newState);
        });
        return updatedTabs;
      });
    },
    [browserStateStore, tabStates]
  );

  const searchInputRef = useRef<TextInput>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const webViewRefs = useRef<WebView[]>([]);

  const searchViewProgress = useSharedValue(0);
  const scrollViewOffset = useScrollViewOffset(scrollViewRef);
  const tabViewProgress = useSharedValue(0);

  useEffect(() => {
    if (isSearchInputFocused) {
      searchViewProgress.value = withTiming(1, timingConfig);
    } else {
      searchViewProgress.value = withTiming(0, timingConfig);
    }
  }, [searchViewProgress, isSearchInputFocused]);

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
        let newActiveTabIndex = tabIndex;
        if (tabIndex === activeTabIndex) {
          if (tabIndex < updatedTabs.length - 1) {
            setActiveTabIndex(tabIndex);
          } else if (tabIndex > 0) {
            setActiveTabIndex(tabIndex - 1);
            newActiveTabIndex = tabIndex - 1;
          }
        }
        updatedTabs.splice(tabIndex, 1);
        webViewRefs.current.splice(tabIndex, 1);
        InteractionManager.runAfterInteractions(() => {
          browserStateStore.deleteTab(tabIndex);
          browserStateStore.setActiveTab(newActiveTabIndex);
        });
        return updatedTabs;
      });
    },
    [activeTabIndex, browserStateStore]
  );

  const newTab = useCallback(() => {
    setActiveTabIndex(tabStates.length);
    setTabStates(prevTabStates => {
      const updatedTabs = [...prevTabStates];
      updatedTabs.push({
        canGoBack: false,
        canGoForward: false,
        url: RAINBOW_HOME,
      });
      InteractionManager.runAfterInteractions(() => {
        browserStateStore.addTab({
          canGoBack: false,
          canGoForward: false,
          url: RAINBOW_HOME,
          title: 'New Tab',
          isActive: true,
        });
      });
      return updatedTabs;
    });
    toggleTabView();
  }, [browserStateStore, tabStates.length, toggleTabView]);

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
        isSearchInputFocused,
        newTab,
        onRefresh,
        searchViewProgress,
        searchInputRef,
        setActiveTabIndex,
        setIsSearchInputFocused,
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
