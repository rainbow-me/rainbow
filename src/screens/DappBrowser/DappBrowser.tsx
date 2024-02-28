import { BlurView } from '@react-native-community/blur';
import isValidDomain from 'is-valid-domain';
import { AnimatePresence, MotiView } from 'moti';
import React, { useState, useRef, useEffect, useContext, createContext, useCallback, useMemo } from 'react';
import { Freeze } from 'react-freeze';
import {
  TouchableOpacity,
  Share,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  TouchableWithoutFeedback,
  TextInput,
  View,
  Image,
} from 'react-native';
import RNFS from 'react-native-fs';
import { MMKV } from 'react-native-mmkv';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { transformOrigin } from 'react-native-redash';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import ViewShot from 'react-native-view-shot';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';

import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import { ButtonPressAnimation } from '@/components/animations';
import { Input } from '@/components/inputs';
import { Page } from '@/components/layout';
import { Bleed, Box, ColorModeProvider, Columns, Inline, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { useTheme } from '@/theme';

const WEBVIEW_HEIGHT = deviceUtils.dimensions.height - safeAreaInsetValues.top;
// -
// safeAreaInsetValues.top -
// safeAreaInsetValues.bottom -
// 48 -
// 72 -
// 56 -
// 2
const COLLAPSED_WEBVIEW_ASPECT_RATIO = 4 / 3;
const COLLAPSED_WEBVIEW_HEIGHT_UNSCALED = Math.min(WEBVIEW_HEIGHT, deviceUtils.dimensions.width * COLLAPSED_WEBVIEW_ASPECT_RATIO);

const TAB_VIEW_COLUMN_WIDTH = (deviceUtils.dimensions.width - 20 * 3) / 2;
const TAB_VIEW_TAB_HEIGHT = TAB_VIEW_COLUMN_WIDTH * (COLLAPSED_WEBVIEW_HEIGHT_UNSCALED / deviceUtils.dimensions.width);
const TAB_VIEW_ROW_HEIGHT = TAB_VIEW_TAB_HEIGHT + 28;

const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const HTTP = 'http://';
const HTTPS = 'https://';

const screenshotStorage = new MMKV();

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
  // duration: 420,
  // easing: Easing.bezier(0.05, 0.7, 0.1, 1),
  // duration: 300,
  // easing: Easing.bezier(0.2, 0, 0, 1),
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const getInjectedJS = async () => {
  return RNFS.readFile(`${RNFS.MainBundlePath}/InjectedJSBundle.js`, 'utf8');
};

export const DappBrowser = () => {
  return (
    <BrowserContextProvider>
      <ColorModeProvider value="dark">
        <DappBrowserComponent />
      </ColorModeProvider>
    </BrowserContextProvider>
  );
};

const getWebsiteBackgroundColor = `
  const bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
  window.ReactNativeWebView.postMessage(bgColor);
  true;
  `;

const DappBrowserComponent = () => {
  const { scrollViewRef, tabStates, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { width: deviceWidth } = useDimensions();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const loadProgress = useSharedValue(0);

  const keyboard = useAnimatedKeyboard();

  const backgroundStyle = useAnimatedStyle(
    () => ({
      opacity: tabViewProgress?.value ?? 0,
    }),
    []
  );

  const bottomBarStyle = useAnimatedStyle(
    () => ({
      height: safeAreaInsetValues.bottom + 46 + 58 * (1 - (tabViewProgress?.value ?? 0)),
      transform: [{ translateY: Math.min(-(keyboard.height.value - 70), 0) }],
    }),
    []
  );

  const progressBarStyle = useAnimatedStyle(
    () => ({
      opacity: loadProgress.value === 1 ? withTiming(0, timingConfig) : withTiming(1, timingConfig),
      width: loadProgress.value * deviceWidth,
    }),
    []
  );

  return (
    <SheetGestureBlocker>
      <Box as={Page} height="full" style={styles.rootViewBackground} width="full">
        <Box
          as={Animated.View}
          borderRadius={ScreenCornerRadius}
          height="full"
          position="absolute"
          style={[backgroundStyle, { backgroundColor: globalColors.grey100 }]}
          width="full"
        />
        <Animated.ScrollView
          contentContainerStyle={{
            backgroundColor: globalColors.grey100,
            height: Math.ceil(tabStates.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 104,
            zIndex: 20000,
          }}
          ref={scrollViewRef}
          scrollEnabled={tabViewVisible}
          showsVerticalScrollIndicator={false}
        >
          {tabStates.map((tab, index) => (
            <BrowserTab key={index} loadProgress={loadProgress} tabIndex={index} />
          ))}
        </Animated.ScrollView>
        <Box
          as={AnimatedBlurView}
          blurAmount={25}
          blurType="chromeMaterialDark"
          justifyContent="flex-end"
          bottom={{ custom: 0 }}
          paddingBottom={{ custom: safeAreaInsetValues.bottom }}
          pointerEvents="box-none"
          position="absolute"
          style={[bottomBarStyle, { zIndex: 10000 }]}
          width={{ custom: deviceWidth }}
        >
          <AddressBar />
          <BrowserToolbar />
          <Box as={Animated.View} background="blue" style={[styles.progressBar, progressBarStyle]} />
          <Box height={{ custom: 0.5 }} position="absolute" style={{ backgroundColor: separatorSecondary }} top="0px" width="full" />
        </Box>
      </Box>
    </SheetGestureBlocker>
  );
};

interface BrowserContextType {
  activeTabIndex: number;
  closeTab: (tabIndex: number) => void;
  goBack: () => void;
  goForward: () => void;
  isBrowserInputFocused: boolean;
  // loadProgress: Animated.SharedValue<number> | undefined;
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
  // loadProgress: undefined,
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
    { url: 'https://www.google.com/', canGoBack: false, canGoForward: false },
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

// this is sloppy and causes tons of rerenders, needs to be reworked
export const BrowserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isBrowserInputFocused, setIsBrowserInputFocused] = useState<boolean>(false);
  const [tabStates, setTabStates] = useState<TabState[]>([
    { url: 'https://www.google.com/', canGoBack: false, canGoForward: false },
    {
      url: 'https://www.rainbowkit.com/',
      canGoBack: false,
      canGoForward: false,
    },
    { url: 'https://app.uniswap.org/', canGoBack: false, canGoForward: false },
    { url: 'https://www.google.com/', canGoBack: false, canGoForward: false },
  ]);
  const [tabViewFullyVisible, setTabViewFullyVisible] = useState(false);
  const [tabViewVisible, setTabViewVisible] = useState(false);

  const updateActiveTabState = useCallback((tabIndex: number, newState: Partial<TabState>) => {
    setTabStates(prevTabStates => {
      const updatedTabs = [...prevTabStates];
      updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...newState };
      return updatedTabs;
    });
  }, []);

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

interface BrowserTabProps {
  loadProgress: Animated.SharedValue<number>;
  tabIndex: number;
}

type ScreenshotType = {
  id: string;
  isRendered?: boolean;
  uri: string;
};

const getStoredScreenshots = (): ScreenshotType[] => {
  const persistedScreenshots = screenshotStorage.getString('screenshotTestStorage');
  return persistedScreenshots ? (JSON.parse(persistedScreenshots) as ScreenshotType[]) : [];
};

// need a better key system for tabs and persisted data
const getTabId = (tabIndex: number, url: string) => {
  return `${tabIndex}-${url}`;
};

const getInitialScreenshot = (id: string): ScreenshotType | null => {
  const persistedData = screenshotStorage.getString('screenshotTestStorage');
  if (persistedData) {
    const screenshots = JSON.parse(persistedData);

    if (!Array.isArray(screenshots)) {
      console.error('Retrieved screenshots data is not an array');
      return null;
    }

    const matchingScreenshot = screenshots.find(screenshot => screenshot.id === id);
    if (matchingScreenshot) {
      return {
        ...matchingScreenshot,
        uri: `${RNFS.DocumentDirectoryPath}/${matchingScreenshot.uri}`,
      };
    }
  }
  return null;
};

const BrowserTab = React.memo(function BrowserTab({ loadProgress, tabIndex }: BrowserTabProps) {
  const {
    activeTabIndex,
    scrollViewOffset,
    setActiveTabIndex,
    tabStates,
    tabViewProgress,
    tabViewFullyVisible,
    tabViewVisible,
    toggleTabView,
    updateActiveTabState,
    webViewRefs,
  } = useBrowserContext();
  const { colorMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();

  const [injectedJS, setInjectedJS] = useState<string | null>(null);
  const messengers = useRef<any[]>([]);

  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot | null>(null);

  // console.log('tab view visible (within browser tab): ' + tabViewVisible);

  const isActiveTab = useMemo(() => activeTabIndex === tabIndex, [activeTabIndex, tabIndex]);

  const tabId = useMemo(() => `${tabIndex}-${tabStates[tabIndex].url}`, [tabIndex, tabStates]);

  // const separatorSecondary = useForegroundColor('separatorSecondary');

  // console.log('DID RERENDER TAB ' + tabIndex);

  // const animatedIsActiveTab = useSharedValue(
  //   activeTabIndex === tabIndex ? 1 : 0
  // );
  // const animatedMultipleTabsOpen = useSharedValue(tabStates.length > 1 ? 1 : 0);
  // const animatedTabIndex = useSharedValue(tabIndex);

  // useEffect(() => {
  //   animatedIsActiveTab.value = withTiming(
  //     activeTabIndex === tabIndex ? 1 : 0,
  //     timingConfig
  //   );
  //   animatedMultipleTabsOpen.value = withTiming(
  //     tabStates.length > 1 ? 1 : 0,
  //     timingConfig
  //   );
  //   animatedTabIndex.value = withTiming(tabIndex, timingConfig);
  // }, [
  //   activeTabIndex,
  //   animatedIsActiveTab,
  //   animatedMultipleTabsOpen,
  //   animatedTabIndex,
  //   tabIndex,
  //   tabStates.length,
  // ]);

  useEffect(() => {
    const loadInjectedJS = async () => {
      try {
        console.log('[BROWSER]: loading injected JS...');
        const jsToInject = await getInjectedJS();
        console.log('[BROWSER]: got injected JS', jsToInject);
        setInjectedJS(jsToInject);
      } catch (e) {
        console.log('error', e);
      }
    };
    loadInjectedJS();
  }, []);

  const webViewStyle = useAnimatedStyle(() => {
    const isActiveTab = activeTabIndex === tabIndex;
    const multipleTabsOpen = tabStates.length > 1;

    const progress = tabViewProgress?.value ?? 0;

    const xPositionStart = isActiveTab ? 0 : (tabIndex % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2;

    // eslint-disable-next-line no-nested-ternary
    const xPositionEnd = multipleTabsOpen ? (tabIndex % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2 : 0;

    const xPositionForTab = interpolate(progress, [0, 1], [xPositionStart, xPositionEnd]);

    const yPositionStart =
      (isActiveTab ? 0 : Math.floor(tabIndex / 2) * TAB_VIEW_ROW_HEIGHT - TAB_VIEW_ROW_HEIGHT / 2 - 12) +
      (isActiveTab ? (1 - (tabViewProgress?.value ?? 1)) * (scrollViewOffset?.value ?? 0) : 0);

    const yPositionEnd =
      (multipleTabsOpen ? Math.floor(tabIndex / 2) * TAB_VIEW_ROW_HEIGHT - TAB_VIEW_ROW_HEIGHT / 2 - 12 : 0) +
      (isActiveTab ? (1 - (tabViewProgress?.value ?? 1)) * (scrollViewOffset?.value ?? 0) : 0);

    const yPositionForTab = interpolate(progress, [0, 1], [yPositionStart, yPositionEnd]);

    const scaleValue = interpolate(
      progress,
      [0, 1],
      [isActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, multipleTabsOpen ? TAB_VIEW_COLUMN_WIDTH / deviceWidth : 0.7]
    );

    const topBorderRadius = interpolate(progress, [0, 1], [isActiveTab ? 12 : 30, 30]);
    const bottomBorderRadius = interpolate(progress, [0, 1], [isActiveTab ? ScreenCornerRadius : 30, 30]);
    const height = interpolate(
      progress,
      [0, 1],
      [isActiveTab ? WEBVIEW_HEIGHT : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED]
    );
    const opacity = interpolate(progress, [0, 1], [isActiveTab ? 1 : 0, 1]);

    const transformWithOrigin = transformOrigin(
      { x: 0, y: -height / 2 }, // setting origin to top center
      [{ translateX: xPositionForTab }, { translateY: yPositionForTab + (isActiveTab ? progress : 1) * 137 }, { scale: scaleValue }]
    );

    return {
      borderBottomLeftRadius: bottomBorderRadius,
      borderBottomRightRadius: bottomBorderRadius,
      borderTopLeftRadius: topBorderRadius,
      borderTopRightRadius: topBorderRadius,
      height,
      opacity,
      // eslint-disable-next-line no-nested-ternary
      pointerEvents: progress ? 'box-only' : isActiveTab ? 'auto' : 'none',
      transform: transformWithOrigin,
      zIndex: isActiveTab ? 9999 : 1,
    };
  }, [activeTabIndex, tabIndex, tabViewProgress]);

  const handlePress = () => {
    if (tabViewVisible) {
      if (isActiveTab) {
        toggleTabView();
      } else {
        // console.log('SETTING ACTIVE TAB INDEX = ' + tabIndex);
        setActiveTabIndex(tabIndex);
      }
    }
  };

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (
        navState.url !== tabStates[tabIndex].url &&
        // This prevents
        navState.navigationType !== 'other'
      ) {
        updateActiveTabState(tabIndex, {
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
          url: navState.url,
        });
      } else {
        updateActiveTabState(tabIndex, {
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
        });
      }
    },
    [tabIndex, tabStates, updateActiveTabState]
  );

  useEffect(() => {
    if (tabViewVisible) {
      toggleTabView();
      webViewRef.current?.getSnapshotBeforeUpdate;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabIndex]);

  // useEffect(() => {
  //   if (tabStates[tabIndex].url) {
  //     const persistedScreenshotData = getInitialScreenshot(
  //       tabStates[tabIndex].url
  //     );
  //     if (persistedScreenshotData) {
  //       setScreenshot(persistedScreenshotData);
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [tabStates[tabIndex].url]);

  useEffect(() => {
    if (webViewRef.current !== null) {
      webViewRefs.current[tabIndex] = webViewRef.current;
    }

    const currentWebviewRef = webViewRefs.current;

    return () => {
      currentWebviewRef[tabIndex] = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex, webViewRef.current, webViewRefs]);

  const [screenshot, setScreenshot] = useState<ScreenshotType | null>(() => getInitialScreenshot(tabId));

  // const checkFileExistence = async (filePath: string) => {
  //   const permaPath = `${getInitialScreenshot(tabStates[tabIndex].url)?.uri}`;
  //   console.log(`Permanent file existence at path: ${permaPath}`);
  //   try {
  //     const fileExists = await RNFS.exists(filePath);
  //     console.log(`File exists: ${fileExists}, Path: ${filePath}`);
  //     return fileExists;
  //   } catch (error) {
  //     console.error('Error checking file existence:', error);
  //     return false;
  //   }
  // };

  // useEffect(() => {
  //   if (screenshot?.uri) {
  //     checkFileExistence(screenshot.uri);
  //   }
  // }, [screenshot]);

  // const [shouldFreeze, setShouldFreeze] = useState(false);
  // const [isLoaded, setIsLoaded] = useState(false);

  const saveScreenshotToFileSystem = async (tempUri: string, url: string) => {
    const fileName = `screenshot-${Date.now()}.jpg`;
    // const screenshotId = Date.now().toString();

    try {
      await RNFS.copyFile(tempUri, `${RNFS.DocumentDirectoryPath}/${fileName}`);
      const newScreenshot: ScreenshotType = {
        id: getTabId(tabIndex, url),
        uri: fileName,
        isRendered: true,
      };

      // Retrieve existing screenshots
      const existingScreenshots = getStoredScreenshots();
      const updatedScreenshots = [...existingScreenshots, newScreenshot];

      screenshotStorage.set('screenshotTestStorage', JSON.stringify(updatedScreenshots));
    } catch (error) {
      console.error('Error saving screenshot to file system:', error);
    }
  };

  useEffect(() => {
    if (
      tabViewFullyVisible &&
      isActiveTab &&
      viewShotRef.current &&
      webViewRefs.current[tabIndex] &&
      (!screenshot || screenshot.id !== tabId)
    ) {
      const captureRef = viewShotRef.current;
      if (captureRef && captureRef.capture) {
        captureRef
          .capture()
          .then(uri => {
            const url = tabStates[tabIndex].url;
            setScreenshot({ id: tabId, uri });
            saveScreenshotToFileSystem(uri, url);
          })
          .catch(error => {
            console.error('Failed to capture screenshot:', error);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabViewFullyVisible]);

  const [backgroundColor, setBackgroundColor] = useState<string>();

  const createMessengers = (origin: string) => {
    const newMessenger = {
      onMessage: (data: any) => {
        alert('[BROWSER]: APP RECEIVED MESSAGE' + JSON.stringify(data));
      },
      sendMessage: (data: any) => {
        console.log('[BROWSER]: sending msg to webview');
        webViewRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
      },
      url: origin,
    };

    messengers.current.push(newMessenger);
  };

  useEffect(() => {
    setTimeout(() => {
      const m = messengers.current.find(m => {
        return m.url === new URL(tabStates[tabIndex].url).origin;
      });
      if (m) {
        m?.sendMessage({ type: 'message', payload: 'ping' });
      }
    }, 5000);
  });

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    // setBackgroundColor(event.nativeEvent.data);
    let data = event.nativeEvent.data as any;
    try {
      // validate message and parse data
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      if (!parsedData || (!parsedData.name && !parsedData.type)) return;
      // ignore other messages like loading progress
      if (parsedData.type === 'message') {
        const { origin } = new URL(event.nativeEvent.url);
        messengers.current.forEach((m: any) => {
          const messengerUrlOrigin = new URL(m.url).origin;
          if (messengerUrlOrigin === origin) {
            m.onMessage(parsedData);
          }
        });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }, []);

  const handleOnLoadStart = useCallback((event: { nativeEvent: { url: string | URL } }) => {
    const { origin } = new URL(event.nativeEvent.url);
    messengers.current = [];
    createMessengers(origin);
  }, []);

  const handleOnLoad = useCallback(() => {}, []);

  const handleOnLoadEnd = useCallback(() => {}, []);

  const handleOnError = useCallback(() => {}, []);

  const handleShouldStartLoadWithRequest = useCallback(() => {
    return true;
  }, []);

  const handleOnLoadProgress = useCallback(
    ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
      if (loadProgress) {
        if (loadProgress.value === 1) loadProgress.value = 0;
        loadProgress.value = withTiming(nativeEvent.progress, timingConfig);
      }
    },
    [loadProgress]
  );

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View
        style={[
          styles.webViewContainer,
          // { borderColor: tabViewVisible ? 'transparent' : separatorSecondary },
          webViewStyle,
        ]}
      >
        <ViewShot options={{ format: 'jpg' }} ref={viewShotRef}>
          <View
            collapsable={false}
            style={{
              backgroundColor: backgroundColor || (colorMode === 'dark' ? '#191A1C' : globalColors.white100),
              height: WEBVIEW_HEIGHT,
              width: '100%',
            }}
          >
            <Freeze
              freeze={
                !isActiveTab
                // || (isActiveTab &&
                // tabViewFullyVisible &&
                // screenshot?.url === tabStates[tabIndex].url
                // && !!screenshot?.isRendered
                // )
              }
              placeholder={
                <Box
                  style={[
                    styles.webViewStyle,
                    {
                      backgroundColor: backgroundColor || (colorMode === 'dark' ? '#191A1C' : globalColors.blueGrey10),
                      height: COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
                    },
                  ]}
                />
              }
            >
              <WebView
                injectedJavaScriptBeforeContentLoaded={injectedJS}
                allowsInlineMediaPlayback
                allowsBackForwardNavigationGestures
                applicationNameForUserAgent={'Rainbow Wallet'}
                automaticallyAdjustContentInsets
                automaticallyAdjustsScrollIndicatorInsets
                containerStyle={{
                  overflow: 'visible',
                }}
                contentInset={{
                  bottom: safeAreaInsetValues.bottom + 104,
                }}
                decelerationRate={'normal'}
                injectedJavaScript={getWebsiteBackgroundColor}
                mediaPlaybackRequiresUserAction
                onLoadStart={handleOnLoadStart}
                onLoad={handleOnLoad}
                onLoadEnd={handleOnLoadEnd}
                onError={handleOnError}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                onLoadProgress={handleOnLoadProgress}
                onMessage={handleMessage}
                onNavigationStateChange={handleNavigationStateChange}
                originWhitelist={['*']}
                ref={webViewRef}
                source={{ uri: tabStates[tabIndex].url }}
                style={[
                  styles.webViewStyle,
                  {
                    backgroundColor: backgroundColor || (colorMode === 'dark' ? globalColors.grey100 : globalColors.white100),
                  },
                ]}
              />
            </Freeze>
          </View>
        </ViewShot>
        <AnimatePresence>
          {(!isActiveTab || tabViewVisible) && (
            <MotiView
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              from={{ opacity: 0 }}
              // height={WEBVIEW_HEIGHT}
              pointerEvents="none"
              // source={{ uri: screenshot?.uri }}
              style={[
                styles.webViewStyle,
                {
                  // backgroundColor:
                  //   colorMode === 'dark'
                  //     ? '#191A1C'
                  //     : globalColors.blueGrey10,
                  height: COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
                  left: 0,
                  position: 'absolute',
                  // resizeMode: 'contain',
                  top: 0,
                  // top:
                  //   -(WEBVIEW_HEIGHT - COLLAPSED_WEBVIEW_HEIGHT_UNSCALED) / 2,
                  zIndex: 20000,
                },
              ]}
              transition={{
                duration: 300,
                easing: Easing.bezier(0.2, 0, 0, 1),
                type: 'timing',
              }}
              // width={deviceWidth}
            >
              <Image
                height={WEBVIEW_HEIGHT}
                // onLayout={() => {
                //   if (screenshot?.isRendered) return;
                //   setScreenshot({
                //     isRendered: true,
                //     uri: screenshot?.uri,
                //     url: screenshot?.url,
                //   });
                // }}
                onError={e => console.log('Image loading error:', e.nativeEvent.error)}
                // source={{ uri: screenshot?.uri }}
                source={{ uri: screenshot?.uri }}
                // source={{ uri: `file://${screenshot.uri}` }}
                style={[
                  styles.webViewStyle,
                  {
                    // backgroundColor:
                    //   colorMode === 'dark'
                    //     ? '#191A1C'
                    //     : globalColors.blueGrey10,
                    left: 0,
                    position: 'absolute',
                    resizeMode: 'contain',
                    top: 0,
                  },
                ]}
                width={deviceWidth}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

const AddressBar = () => {
  const { tabStates, activeTabIndex, onRefresh, tabViewProgress, updateActiveTabState } = useBrowserContext();

  const fill = useForegroundColor('fill');

  const inputRef = useRef<TextInput>(null);

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - (tabViewProgress?.value ?? 0),
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
    transform: [
      {
        translateY: interpolate(tabViewProgress?.value ?? 0, [0, 1], [0, 58], 'clamp'),
      },
      {
        scale: interpolate(tabViewProgress?.value ?? 0, [0, 1], [1, 0.9], 'clamp'),
      },
    ],
  }));

  const handleUrlSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    let newUrl = event.nativeEvent.text;

    let urlForValidation = newUrl.replace(/^https?:\/\//, '');
    if (urlForValidation.endsWith('/')) {
      urlForValidation = urlForValidation.slice(0, -1);
    }
    // else {
    //   urlForValidation = extractOrigin(urlForValidation);
    // }

    // console.log('urlForValidation: ' + urlForValidation);

    if (!isValidDomain(urlForValidation, { wildcard: true })) {
      newUrl = GOOGLE_SEARCH_URL + newUrl;
    } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
      newUrl = HTTPS + newUrl;
    }

    // if (newUrl.endsWith('/')) {
    //   newUrl = newUrl.slice(0, -1);
    // }

    // setUrl(newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl);
    updateActiveTabState(activeTabIndex, { url: newUrl });
  };

  const [url, setUrl] = useState<string>(tabStates[activeTabIndex].url);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const formattedUrl = useMemo(() => {
    try {
      const { hostname, pathname, search } = new URL(url);
      if (hostname === 'www.google.com' && pathname === '/search') {
        const params = new URLSearchParams(search);
        return params.get('q') || url;
      }
      // return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
      return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    } catch {
      return url;
    }
  }, [url]);

  // url handling needs work
  useEffect(() => {
    // const urlWithoutWww = url.replace('www.', '');
    // const tabStatesUrlWithoutWww = tabStates[activeTabIndex].url.replace(
    //   'www.',
    //   ''
    // );
    // console.log(
    //   'tab states url = ' +
    //     tabStates[activeTabIndex].url +
    //     ' url = ' +
    //     url +
    //     ' url without www = ' +
    //     urlWithoutWww +
    //     ' tab states url without www = ' +
    //     tabStatesUrlWithoutWww
    // );
    if (
      tabStates[activeTabIndex].url !== url
      // && tabStatesUrlWithoutWww !== urlWithoutWww
    ) {
      setUrl(tabStates[activeTabIndex].url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabIndex, tabStates]);

  const isGoogleSearch = url.startsWith(GOOGLE_SEARCH_URL);

  // const inputAccessoryViewID = 'input-accessory-view-url';

  return (
    <Box as={Animated.View} style={[barStyle, { position: 'relative' }]}>
      <ButtonPressAnimation
        onPress={() => {
          if (!isFocused) {
            setIsFocused(true);
            // InteractionManager.runAfterInteractions(() => {
            //   inputRef.current?.focus();
            // });
            setTimeout(() => {
              inputRef.current?.focus();
            }, 50);
          }
        }}
        padding={16}
        pointerEvents={isFocused ? 'auto' : 'box-only'}
        scaleTo={0.975}
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Input
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          // inputAccessoryViewID={inputAccessoryViewID}
          keyboardType="web-search"
          onBlur={() => setIsFocused(false)}
          onChangeText={setUrl}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={handleUrlSubmit}
          placeholderText="Search or enter website name"
          ref={inputRef}
          returnKeyType="go"
          selectTextOnFocus
          spellCheck={false}
          style={{
            // backgroundColor: '#191A1C',
            backgroundColor: fill,
            borderRadius: 16,
            color: globalColors.white100,
            flex: 1,
            fontSize: 17,
            fontWeight: '500',
            height: 48,
            paddingHorizontal: 16,
            paddingVertical: 10,
            pointerEvents: isFocused ? 'auto' : 'none',
            // shadowColor: globalColors.grey100,
            // shadowOffset: {
            //   height: 4,
            //   width: 0,
            // },
            // shadowOpacity: 1,
            // shadowRadius: 6,
          }}
          value={isFocused && !isGoogleSearch ? url : formattedUrl}
        />
      </ButtonPressAnimation>
      <Box position="absolute" style={{ right: 26, top: 25 }}>
        <ToolbarIcon color="label" icon="􀅈" onPress={onRefresh} size="icon 17px" />
      </Box>
    </Box>
  );
};

const BrowserToolbar = () => {
  const { activeTabIndex, closeTab, goBack, goForward, newTab, tabStates, tabViewProgress, tabViewVisible, toggleTabView } =
    useBrowserContext();
  const { goBack: closeBrowser } = useNavigation();
  const { canGoBack, canGoForward } = tabStates[activeTabIndex];

  // const separatorSecondary = useForegroundColor('separatorSecondary');

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - (tabViewProgress?.value ?? 0),
    pointerEvents: tabViewVisible ? 'none' : 'auto',
  }));

  const tabViewBarStyle = useAnimatedStyle(() => ({
    opacity: tabViewProgress?.value ?? 0,
    pointerEvents: tabViewVisible ? 'auto' : 'none',
  }));

  const onShare = async () => {
    try {
      await Share.share({ message: tabStates[activeTabIndex].url });
    } catch (error) {
      console.error('Error sharing browser URL', error);
    }
  };

  return (
    <>
      <Box
        as={Animated.View}
        style={[
          {
            alignItems: 'center',
            // backgroundColor: '#191A1C',
            // borderBottomColor: separatorSecondary,
            // borderBottomWidth: 1,
            // borderTopColor: separatorSecondary,
            // borderTopWidth: 1,
            flexDirection: 'row',
            // height: 56,
            // justifyContent: 'space-between',
            // paddingHorizontal: 20,
            paddingBottom: 10,
            paddingTop: 6,
            width: deviceUtils.dimensions.width,
          },
          barStyle,
        ]}
      >
        <Columns alignHorizontal="justify" alignVertical="center" space="16px">
          <ToolbarIcon icon="􀆉" disabled={!canGoBack} onPress={goBack} />
          <ToolbarIcon icon="􀆊" disabled={!canGoForward} onPress={goForward} />
          {/* <ToolbarTextButton
            label="Close"
            onPress={closeBrowser}
            showBackground
          /> */}
          <ToolbarIcon icon="􀁰" onPress={closeBrowser} />
          <ToolbarIcon icon="􀈂" onPress={onShare} />
          <ToolbarIcon icon="􀐅" onPress={toggleTabView} />
        </Columns>
      </Box>
      <Box
        as={Animated.View}
        bottom={{ custom: safeAreaInsetValues.bottom }}
        position="absolute"
        style={[
          {
            alignItems: 'center',
            // backgroundColor: '#191A1C',
            // borderBottomColor: separatorSecondary,
            // borderBottomWidth: 1,
            // borderTopColor: separatorSecondary,
            // borderTopWidth: 1,
            flexDirection: 'row',
            // height: 56,
            // justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 10,
            paddingTop: 6,
            width: deviceUtils.dimensions.width,
          },
          tabViewBarStyle,
        ]}
      >
        <Columns alignHorizontal="justify" alignVertical="center">
          <Inline alignHorizontal="left">
            {/* <ToolbarIcon icon="􀐇" onPress={newTab} /> */}
            <ToolbarIcon icon="􀅼" onPress={newTab} />
          </Inline>
          <ToolbarIcon icon="􀺾" onPress={() => closeTab(tabStates.length - 1)} />
          <Inline alignHorizontal="right">
            <ToolbarTextButton label="Done" onPress={toggleTabView} textAlign="right" />
          </Inline>
        </Columns>
      </Box>
    </>
  );
};

const ToolbarIcon = ({
  color,
  disabled,
  icon,
  onPress,
  size,
  weight,
}: {
  color?: TextColor;
  disabled?: boolean;
  icon: string;
  onPress: () => void;
  size?: TextSize;
  weight?: TextWeight;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.4}
      disabled={disabled}
      hitSlop={{ bottom: 8, left: 0, right: 0, top: 8 }}
      onPress={onPress}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Box
        alignItems="center"
        height={{ custom: 20 }}
        justifyContent="center"
        // style={{ flexGrow: 1 }}
        // width={{ custom: 24 }}
      >
        <Text
          align="center"
          color={disabled ? 'labelQuaternary' : color || 'blue'}
          size={size || 'icon 20px'}
          weight={weight || 'semibold'}
        >
          {icon}
        </Text>
      </Box>
    </TouchableOpacity>
  );
};

const ToolbarTextButton = ({
  color,
  disabled,
  label,
  onPress,
  showBackground,
  textAlign,
}: {
  color?: TextColor;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  showBackground?: boolean;
  textAlign?: 'center' | 'left' | 'right';
}) => {
  const { colors } = useTheme();
  const hexColor = useForegroundColor(color || 'blue');

  return (
    <TouchableOpacity
      activeOpacity={0.4}
      disabled={disabled}
      hitSlop={{ bottom: 8, left: 0, right: 0, top: 8 }}
      onPress={onPress}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Bleed vertical={showBackground ? '4px' : undefined}>
        <Box
          alignItems="center"
          borderRadius={showBackground ? 14 : undefined}
          height={{ custom: showBackground ? 28 : 20 }}
          justifyContent="center"
          paddingHorizontal={showBackground ? '8px' : undefined}
          style={{
            backgroundColor: showBackground ? colors.alpha(hexColor, 0.1) : undefined,
            flex: 1,
          }}
          // width={{ custom: 24 }}
        >
          <Text align={textAlign || 'center'} color={disabled ? 'labelQuaternary' : color || 'blue'} size="17pt" weight="bold">
            {label}
          </Text>
        </Box>
      </Bleed>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    // bottom: safeAreaInsetValues.bottom + 102,
    height: 2,
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 11000,
  },
  rootViewBackground: {
    // backgroundColor: globalColors.grey100,
    backgroundColor: 'transparent',
    flex: 1,
    // paddingBottom: safeAreaInsetValues.bottom + 48,
    // paddingTop: safeAreaInsetValues.top,
  },
  webViewContainer: {
    alignSelf: 'center',
    // backgroundColor: 'red',
    // borderWidth: 1,
    // justifyContent: 'center',
    overflow: 'hidden',
    position: 'absolute',
    // position: 'relative',
    // top: safeAreaInsetValues.top + 72,
    top: safeAreaInsetValues.top,
    // top: 0,
    // transformOrigin: 'top',
    width: deviceUtils.dimensions.width,
  },
  webViewStyle: {
    borderCurve: 'continuous',
    // borderRadius: 10,
    // borderWidth: 1,
    // flex: 1,
    height: WEBVIEW_HEIGHT,
    // left: 0,
    maxHeight: WEBVIEW_HEIGHT,
    minHeight: WEBVIEW_HEIGHT,
    // position: 'absolute',
    // top: safeAreaInsetValues.top,
    width: deviceUtils.dimensions.width,
  },
});
