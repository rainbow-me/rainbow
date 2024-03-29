/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import isEqual from 'react-fast-compare';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import Animated, {
  AnimatedRef,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useScrollViewOffset,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import WebView from 'react-native-webview';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { generateUniqueId } from './utils';

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
  activeTabIndex: number;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  closeTab: (tabId: string) => void;
  goBack: () => void;
  goForward: () => void;
  newTab: () => void;
  onRefresh: () => void;
  searchInputRef: React.RefObject<TextInput | null>;
  searchViewProgress: SharedValue<number> | undefined;
  scrollViewOffset: SharedValue<number> | undefined;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  setActiveTabIndex: React.Dispatch<React.SetStateAction<number>>;
  tabStates: TabState[];
  tabViewProgress: SharedValue<number> | undefined;
  tabViewVisible: SharedValue<boolean> | undefined;
  toggleTabViewWorklet: (activeIndex?: number) => void;
  updateActiveTabState: (newState: Partial<TabState>, tabId?: string) => void;
  webViewRefs: React.MutableRefObject<(WebView | null)[]>;
}

export interface TabState {
  canGoBack: boolean;
  canGoForward: boolean;
  uniqueId: string;
  url: string;
}

export const RAINBOW_HOME = 'RAINBOW_HOME';

const DEFAULT_TAB_STATE: TabState[] = [
  { canGoBack: false, canGoForward: false, uniqueId: generateUniqueId(), url: RAINBOW_HOME },
  {
    canGoBack: false,
    canGoForward: false,
    uniqueId: generateUniqueId(),
    url: 'https://bx-e2e-dapp.vercel.app',
  },
  { canGoBack: false, canGoForward: false, uniqueId: generateUniqueId(), url: 'https://app.uniswap.org/swap' },
  { canGoBack: false, canGoForward: false, uniqueId: generateUniqueId(), url: 'https://meme.market' },
];

const DEFAULT_BROWSER_CONTEXT: BrowserContextType = {
  activeTabIndex: 0,
  animatedActiveTabIndex: undefined,
  closeTab: () => {
    return;
  },
  goBack: () => {
    return;
  },
  goForward: () => {
    return;
  },
  newTab: () => {
    return;
  },
  onRefresh: () => {
    return;
  },
  searchInputRef: { current: null },
  searchViewProgress: undefined,
  scrollViewOffset: undefined,
  // @ts-expect-error Explicitly allowing null/undefined on the AnimatedRef causes type issues
  scrollViewRef: { current: null },
  setActiveTabIndex: () => {
    return;
  },
  tabStates: DEFAULT_TAB_STATE,
  tabViewProgress: undefined,
  tabViewVisible: undefined,
  tabViewVisibleRef: { current: null },
  toggleTabView: () => {
    return;
  },
  toggleTabViewWorklet: () => {
    'worklet';
    return;
  },
  updateActiveTabState: () => {
    return;
  },
  webViewRefs: { current: [] },
};

const BrowserContext = createContext<BrowserContextType>(DEFAULT_BROWSER_CONTEXT);

export const useBrowserContext = () => useContext(BrowserContext);

const tabStateStore = new MMKV();

const EMPTY_TAB_STATE: TabState[] = [];

export const BrowserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [tabStates, setTabStates] = useMMKVObject<TabState[]>('tabStateStorage', tabStateStore);

  const updateActiveTabState = useCallback(
    (newState: Partial<TabState>, tabId?: string) => {
      if (!tabStates) return;

      const tabIndex = tabId ? tabStates.findIndex(tab => tab.uniqueId === tabId) : activeTabIndex;
      if (tabIndex === -1) return;

      if (isEqual(tabStates[tabIndex], newState)) return;

      const updatedTabs = [...tabStates];
      updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...newState };

      setTabStates(updatedTabs);
    },
    [activeTabIndex, setTabStates, tabStates]
  );

  const searchInputRef = useRef<TextInput>(null);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const webViewRefs = useRef<WebView[]>([]);

  const searchViewProgress = useSharedValue(0);
  const scrollViewOffset = useScrollViewOffset(scrollViewRef);
  const tabViewVisible = useSharedValue(false);
  const animatedActiveTabIndex = useSharedValue(0);
  const { tabViewProgress } = useBrowserTabViewProgressContext();

  const toggleTabViewWorklet = useCallback(
    (activeIndex?: number) => {
      'worklet';
      const willTabViewBecomeVisible = !tabViewVisible.value;
      const tabIndexProvided = activeIndex !== undefined;

      if (tabIndexProvided && !willTabViewBecomeVisible) {
        animatedActiveTabIndex.value = activeIndex;
        runOnJS(setActiveTabIndex)(activeIndex);
      }
      if (tabViewProgress !== undefined) {
        tabViewProgress.value = willTabViewBecomeVisible
          ? withSpring(100, SPRING_CONFIGS.browserTabTransition)
          : withSpring(0, SPRING_CONFIGS.browserTabTransition);
      }

      tabViewVisible.value = willTabViewBecomeVisible;
    },
    [animatedActiveTabIndex, tabViewProgress, tabViewVisible]
  );

  const newTab = useCallback(() => {
    const newTabToAdd = {
      canGoBack: false,
      canGoForward: false,
      uniqueId: generateUniqueId(),
      url: RAINBOW_HOME,
    };

    if (!tabStates) {
      setTabStates([newTabToAdd]);
      runOnUI(toggleTabViewWorklet)(0);
    } else {
      const updatedTabs = [...tabStates, newTabToAdd];
      setTabStates(updatedTabs);
      runOnUI(toggleTabViewWorklet)(updatedTabs.length - 1);
    }
  }, [setTabStates, tabStates, toggleTabViewWorklet]);

  const closeTab = useCallback(
    (tabId: string) => {
      if (!tabStates) return;

      const tabIndex = tabStates.findIndex(tab => tab.uniqueId === tabId);
      if (tabIndex === -1) return;

      const isActiveTab = tabIndex === activeTabIndex;
      const isLastTab = tabIndex === tabStates.length - 1;
      const hasNextTab = tabIndex < tabStates.length - 1;

      let newActiveTabIndex = activeTabIndex;

      if (isActiveTab) {
        if (isLastTab && tabIndex === 0) {
          setActiveTabIndex(0);
          animatedActiveTabIndex.value = 0;
          setTabStates(EMPTY_TAB_STATE);
          webViewRefs.current = [];
          newTab();
          return;
        } else if (isLastTab && tabIndex > 0) {
          newActiveTabIndex = tabIndex - 1;
        } else if (hasNextTab) {
          newActiveTabIndex = tabIndex;
        }
      } else if (tabIndex < activeTabIndex) {
        newActiveTabIndex = activeTabIndex - 1;
      }

      const updatedTabs = [...tabStates.slice(0, tabIndex), ...tabStates.slice(tabIndex + 1)];
      setTabStates(updatedTabs);
      setActiveTabIndex(newActiveTabIndex);
      animatedActiveTabIndex.value = newActiveTabIndex;
      webViewRefs.current.splice(tabIndex, 1);
    },
    [activeTabIndex, animatedActiveTabIndex, newTab, setTabStates, tabStates, webViewRefs]
  );

  const goBack = useCallback(() => {
    const activeWebview = webViewRefs.current[activeTabIndex];
    if (activeWebview && tabStates?.[activeTabIndex]?.canGoBack) {
      activeWebview.goBack();
    }
  }, [activeTabIndex, tabStates, webViewRefs]);

  const goForward = useCallback(() => {
    const activeWebview = webViewRefs.current[activeTabIndex];
    if (activeWebview && tabStates?.[activeTabIndex]?.canGoForward) {
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
        animatedActiveTabIndex,
        closeTab,
        goBack,
        goForward,
        newTab,
        onRefresh,
        searchViewProgress,
        searchInputRef,
        setActiveTabIndex,
        scrollViewOffset,
        scrollViewRef,
        tabStates: tabStates || [],
        tabViewProgress,
        tabViewVisible,
        toggleTabViewWorklet,
        updateActiveTabState,
        webViewRefs,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
};
