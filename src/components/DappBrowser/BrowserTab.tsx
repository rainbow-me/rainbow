/* eslint-disable @typescript-eslint/no-explicit-any */
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import { Box, globalColors, useColorMode } from '@/design-system';
import { useAccountAccentColor, useDimensions } from '@/hooks';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  convertToRGBA,
  dispatchCommand,
  interpolate,
  isColor,
  runOnJS,
  setNativeProps,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { MMKV } from 'react-native-mmkv';
import { RAINBOW_HOME, TabState, useBrowserContext } from './BrowserContext';
import { Freeze } from 'react-freeze';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  INVERTED_MULTI_TAB_SCALE,
  INVERTED_SINGLE_TAB_SCALE,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_ROW_HEIGHT,
  TAB_VIEW_TAB_HEIGHT,
  WEBVIEW_HEIGHT,
} from './Dimensions';
import RNFS from 'react-native-fs';
import { WebViewEvent } from 'react-native-webview/lib/WebViewTypes';
import { appMessenger } from '@/browserMessaging/AppMessenger';
import { IS_ANDROID, IS_IOS } from '@/env';
import { CloseTabButton, X_BUTTON_PADDING, X_BUTTON_SIZE } from './CloseTabButton';
import DappBrowserWebview from './DappBrowserWebview';
import Homepage from './Homepage';
import { handleProviderRequestApp } from './handleProviderRequest';
import { WebViewBorder } from './WebViewBorder';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '../animations/animationConfigs';
import { FASTER_IMAGE_CONFIG } from './constants';

// ⚠️ TODO: Split this file apart into hooks, smaller components
// useTabScreenshots, useAnimatedWebViewStyles, useWebViewGestures

interface BrowserTabProps {
  tabId: string;
  tabIndex: number;
  injectedJS: string;
}

interface ScreenshotType {
  id: string;
  timestamp: number;
  uri: string;
  url: string;
}

const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

const tabScreenshotStorage = new MMKV();

const getStoredScreenshots = (): ScreenshotType[] => {
  const persistedScreenshots = tabScreenshotStorage.getString('tabScreenshots');
  return persistedScreenshots ? (JSON.parse(persistedScreenshots) as ScreenshotType[]) : [];
};

const findTabScreenshot = (id: string, url: string): ScreenshotType | null => {
  const persistedData = tabScreenshotStorage.getString('tabScreenshots');
  if (persistedData) {
    const screenshots = JSON.parse(persistedData);

    if (!Array.isArray(screenshots)) {
      try {
        console.error('Screenshot data is malformed — expected array: ', JSON.stringify(screenshots, null, 2));
      } catch (error) {
        console.error('Error stringifying malformed screenshot data:', error);
      }
      return null;
    }

    const matchingScreenshots = screenshots.filter(screenshot => screenshot.id === id);
    const screenshotsWithMatchingUrl = matchingScreenshots.filter(screenshot => screenshot.url === url);

    if (screenshotsWithMatchingUrl.length > 0) {
      const mostRecentScreenshot = screenshotsWithMatchingUrl.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
      return {
        ...mostRecentScreenshot,
        uri: `${RNFS.DocumentDirectoryPath}/${mostRecentScreenshot.uri}`,
      };
    }
  }

  return null;
};

export const pruneScreenshots = async (tabStates: TabState[]): Promise<void> => {
  // HELPER LOG
  // const startTime = performance.now();

  const tabStateMap = tabStates.reduce((acc: Record<string, string>, tab: TabState) => {
    acc[tab.uniqueId] = tab.url;
    return acc;
  }, {});

  const persistedData = tabScreenshotStorage.getString('tabScreenshots');
  if (!persistedData) return;

  const screenshots: ScreenshotType[] = JSON.parse(persistedData) || [];
  const screenshotsGroupedByTabId: Record<string, ScreenshotType[]> = screenshots.reduce(
    (acc: Record<string, ScreenshotType[]>, screenshot: ScreenshotType) => {
      if (tabStateMap[screenshot.id]) {
        if (!acc[screenshot.id]) acc[screenshot.id] = [];
        acc[screenshot.id].push(screenshot);
      }
      return acc;
    },
    {}
  );

  const screenshotsToKeep: ScreenshotType[] = Object.values(screenshotsGroupedByTabId)
    .map((group: ScreenshotType[]) => {
      return group.reduce((mostRecent: ScreenshotType, current: ScreenshotType) => {
        return new Date(mostRecent.timestamp) > new Date(current.timestamp) ? mostRecent : current;
      });
    })
    .filter((screenshot: ScreenshotType) => tabStateMap[screenshot.id] === screenshot.url);

  await deletePrunedScreenshotFiles(screenshots, screenshotsToKeep);

  tabScreenshotStorage.set('tabScreenshots', JSON.stringify(screenshotsToKeep));

  // HELPER LOG
  // const endTime = performance.now();
  // const numberPruned = screenshots.length - screenshotsToKeep.length;
  // if (numberPruned > 0) {
  //   console.log(`🗑️  Pruned ${numberPruned} out of ${screenshots.length} screenshots in ${(endTime - startTime).toFixed(2)}ms`);
  // }
};

const deletePrunedScreenshotFiles = async (allScreenshots: ScreenshotType[], screenshotsToKeep: ScreenshotType[]): Promise<void> => {
  try {
    const filesToDelete = allScreenshots.filter(screenshot => !screenshotsToKeep.includes(screenshot));
    const deletePromises = filesToDelete.map(screenshot => {
      const filePath = `${RNFS.DocumentDirectoryPath}/${screenshot.uri}`;
      return RNFS.unlink(filePath).catch(error => console.error(`Error deleting screenshot file: ${filePath}`, error));
    });
    await Promise.all(deletePromises);
    // HELPER LOG
    // console.log(`🗑️  Deleted ${filesToDelete.length} screenshot files`);
  } catch (error) {
    console.error('Error during file deletion:', error);
  }
};

const getWebsiteBackgroundColorAndTitle = `
  const bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
  window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "bg", payload: bgColor}));
  window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "title", payload: document.title }));
  true;
  `;

export const BrowserTab = React.memo(function BrowserTab({ tabId, tabIndex, injectedJS }: BrowserTabProps) {
  const {
    activeTabIndex,
    animatedActiveTabIndex,
    closeTab,
    scrollViewRef,
    scrollViewOffset,
    tabStates,
    tabViewProgress,
    tabViewVisible,
    toggleTabViewWorklet,
    updateActiveTabState,
    webViewRefs,
  } = useBrowserContext();
  const { accentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();

  const currentMessenger = useRef<any>(null);
  const title = useRef<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot | null>(null);

  const panRef = useRef();
  const tapRef = useRef();

  const defaultBackgroundColor = isDarkMode ? '#191A1C' : globalColors.white100;
  const backgroundColor = useSharedValue<string>(defaultBackgroundColor);

  // ⚠️ TODO
  const gestureScale = useSharedValue(1);
  const gestureX = useSharedValue(0);
  const gestureY = useSharedValue(0);
  // 👆 Regarding these values 👆
  // Probably more efficient to swap these out for a combined SharedValue object,
  // which can then be manipulated in the gesture handlers with the .modify() method.
  //
  // const closeTabGesture = useSharedValue({
  //   gestureScale: 1,
  //   gestureX: 0,
  //   gestureY: 0,
  // });

  const tabUrl = useMemo(() => tabStates?.[tabIndex]?.url || RAINBOW_HOME, [tabIndex, tabStates]);

  const isActiveTab = useMemo(() => activeTabIndex === tabIndex, [activeTabIndex, tabIndex]);
  const multipleTabsOpen = useMemo(() => tabStates?.length > 1, [tabStates?.length]);

  const isOnHomepage = tabUrl === RAINBOW_HOME;

  const screenshotData = useSharedValue<ScreenshotType | undefined>(findTabScreenshot(tabId, tabUrl) || undefined);

  const animatedWebViewBackgroundColorStyle = useAnimatedStyle(() => {
    const homepageColor = isDarkMode ? globalColors.grey100 : '#FBFCFD';

    if (isOnHomepage) return { backgroundColor: homepageColor };
    if (!backgroundColor.value) return { backgroundColor: defaultBackgroundColor };

    if (isColor(backgroundColor.value)) {
      const rgbaColor = convertToRGBA(backgroundColor.value);

      if (rgbaColor[3] < 1) {
        return { backgroundColor: `rgba(${rgbaColor[0]}, ${rgbaColor[1]}, ${rgbaColor[2]}, 1)` };
      } else {
        return { backgroundColor: backgroundColor.value };
      }
    } else {
      return { backgroundColor: defaultBackgroundColor };
    }
  });

  const animatedWebViewHeight = useDerivedValue(() => {
    const progress = tabViewProgress?.value || 0;
    const isActiveTabAnimated = animatedActiveTabIndex?.value === tabIndex;

    return interpolate(
      progress,
      [0, 100],
      [isActiveTabAnimated ? WEBVIEW_HEIGHT : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED],
      'clamp'
    );

    // const tabViewNotVisibleHeight = isActiveTabAnimated ? WEBVIEW_HEIGHT : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED;
    // const heightForTab = tabViewVisible?.value ? COLLAPSED_WEBVIEW_HEIGHT_UNSCALED : tabViewNotVisibleHeight;

    // return withSpring(heightForTab, SPRING_CONFIGS.browserTabTransition);

    // return tabViewVisible?.value || !isActiveTabAnimated
    //   ? withSpring(COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, SPRING_CONFIGS.browserTabTransition)
    //   : withSpring(WEBVIEW_HEIGHT, SPRING_CONFIGS.browserTabTransition);

    // return withClamp(
    //   { min: COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, max: WEBVIEW_HEIGHT },
    //   withSpring(heightForTab, SPRING_CONFIGS.browserTabTransition)
    // );
  });

  const animatedWebViewStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const isActiveTabAnimated = animatedActiveTabIndex?.value === tabIndex;

    const scale = interpolate(
      progress,
      [0, 100],
      [isActiveTabAnimated ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, multipleTabsOpen ? TAB_VIEW_COLUMN_WIDTH / deviceWidth : 0.7]
    );

    const xPositionStart = isActiveTabAnimated ? 0 : (tabIndex % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2;
    const xPositionEnd = multipleTabsOpen ? (tabIndex % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2 : 0;
    const xPositionForTab = interpolate(progress, [0, 100], [xPositionStart, xPositionEnd]);

    const extraYPadding = 20;

    const yPositionStart =
      (isActiveTabAnimated ? 0 : Math.floor(tabIndex / 2) * TAB_VIEW_ROW_HEIGHT + extraYPadding) +
      (isActiveTabAnimated ? (1 - progress / 100) * (scrollViewOffset?.value || 0) : 0);

    const yPositionEnd =
      (multipleTabsOpen ? Math.floor(tabIndex / 2) * TAB_VIEW_ROW_HEIGHT + extraYPadding : 0) +
      (isActiveTabAnimated ? (1 - progress / 100) * (scrollViewOffset?.value || 0) : 0);

    const yPositionForTab = interpolate(progress, [0, 100], [yPositionStart, yPositionEnd]);

    // Determine the border radius for the minimized tab that achieves concentric corners around the close button
    const invertedScale = multipleTabsOpen ? INVERTED_MULTI_TAB_SCALE : INVERTED_SINGLE_TAB_SCALE;
    const spaceToXButton = invertedScale * X_BUTTON_PADDING;
    const xButtonBorderRadius = (X_BUTTON_SIZE / 2) * invertedScale;
    const tabViewBorderRadius = xButtonBorderRadius + spaceToXButton;

    const borderRadius = interpolate(
      progress,
      [0, 100],
      // eslint-disable-next-line no-nested-ternary
      [isActiveTabAnimated ? (IS_ANDROID ? 0 : 16) : tabViewBorderRadius, tabViewBorderRadius],
      'clamp'
    );

    const opacity = interpolate(progress, [0, 100], [isActiveTabAnimated ? 1 : 0, 1], 'clamp');

    // const height = interpolate(
    //   progress,
    //   [0, 100],
    //   [isActiveTabAnimated ? WEBVIEW_HEIGHT : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED],
    //   'clamp'
    // );
    const height = animatedWebViewHeight.value;

    return {
      borderRadius,
      height,
      opacity,
      // eslint-disable-next-line no-nested-ternary
      pointerEvents: tabViewVisible?.value ? 'box-only' : isActiveTabAnimated ? 'auto' : 'none',
      // ...(IS_IOS && isOnHomepage && !isDarkMode
      //   ? {
      //       shadowOpacity: (progress / 100) * 0.1,
      //     }
      //   : {}),
      transform: [
        { translateY: multipleTabsOpen ? -height / 2 : 0 },
        { translateX: xPositionForTab + gestureX.value },
        { translateY: yPositionForTab + gestureY.value },
        { scale: scale * gestureScale.value },
        { translateY: multipleTabsOpen ? height / 2 : 0 },
      ],
    };
  });

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const isActiveTabAnimated = animatedActiveTabIndex?.value === tabIndex;

    const scaleWeighting =
      gestureScale.value *
      interpolate(
        progress,
        [0, 100],
        [isActiveTabAnimated ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, multipleTabsOpen ? TAB_VIEW_COLUMN_WIDTH / deviceWidth : 0.7],
        'clamp'
      );
    const zIndex = scaleWeighting * (isActiveTabAnimated || gestureScale.value > 1 ? 9999 : 1);

    return { zIndex };
  });

  const pointerEventsStyle = useAnimatedStyle(() => ({
    // eslint-disable-next-line no-nested-ternary
    pointerEvents: tabViewVisible?.value ? 'box-only' : 'none',
  }));

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (navState.url !== tabStates[tabIndex].url) {
        updateActiveTabState(tabId, {
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
          url: navState.url,
        });
      } else {
        updateActiveTabState(tabId, {
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
          url: tabStates[tabIndex].url,
        });
      }
    },
    [tabId, tabIndex, tabStates, updateActiveTabState]
  );

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

  const saveScreenshotToFileSystem = useCallback(
    async (tempUri: string, tabId: string, timestamp: number, url: string) => {
      const fileName = `screenshot-${timestamp}.jpg`;
      try {
        await RNFS.copyFile(tempUri, `${RNFS.DocumentDirectoryPath}/${fileName}`);

        // Build the screenshot object
        const newScreenshot: ScreenshotType = {
          id: tabId,
          timestamp,
          uri: fileName,
          url,
        };

        // Retrieve existing screenshots and merge in the new one
        const existingScreenshots = getStoredScreenshots();
        const updatedScreenshots = [...existingScreenshots, newScreenshot];

        // Update MMKV store with the new screenshot
        tabScreenshotStorage.set('tabScreenshots', JSON.stringify(updatedScreenshots));

        // Determine current RNFS document directory
        const screenshotWithRNFSPath: ScreenshotType = {
          ...newScreenshot,
          uri: `${RNFS.DocumentDirectoryPath}/${newScreenshot.uri}`,
        };

        // Set screenshot for display
        screenshotData.value = screenshotWithRNFSPath;

        // HELPER LOG
        // console.log('📁 Screenshot saved to file system');
      } catch (error) {
        console.error('Error saving screenshot to file system:', error);
      }
    },
    [screenshotData]
  );

  const captureAndSaveScreenshot = useCallback(() => {
    if (viewShotRef.current && webViewRefs.current[tabIndex]) {
      const captureRef = viewShotRef.current;

      if (captureRef && captureRef?.capture) {
        captureRef
          .capture()
          .then(uri => {
            // HELPER LOG
            // console.log('🖼️  Screenshot captured');
            const timestamp = Date.now();
            saveScreenshotToFileSystem(uri, tabId, timestamp, tabStates[tabIndex].url);
          })
          .catch(error => {
            console.error('Failed to capture screenshot:', error);
          });
      }
    }
  }, [saveScreenshotToFileSystem, tabId, tabIndex, tabStates, viewShotRef, webViewRefs]);

  const screenshotSource = useDerivedValue(() => {
    return {
      ...FASTER_IMAGE_CONFIG,
      url: screenshotData.value?.uri ? `file://${screenshotData.value?.uri}` : '',
    } as ImageOptions;
  });

  const animatedScreenshotStyle = useAnimatedStyle(() => {
    const animatedIsActiveTab = animatedActiveTabIndex?.value === tabIndex;
    const screenshotExists = !!screenshotData.value?.uri;
    const screenshotMatchesTabId = screenshotData.value?.id === tabId;
    const screenshotMatchesTabUrl = screenshotData.value?.url === tabUrl;

    const oneMinuteAgo = Date.now() - 1000 * 60;
    const isScreenshotStale = screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo;
    const shouldWaitForNewScreenshot = isScreenshotStale && animatedIsActiveTab;

    const shouldDisplay =
      screenshotExists &&
      screenshotMatchesTabId &&
      screenshotMatchesTabUrl &&
      (!animatedIsActiveTab || !!tabViewVisible?.value) &&
      !shouldWaitForNewScreenshot;

    return {
      opacity: withSpring(shouldDisplay ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
    };
  });

  const handleOnMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (!isActiveTab) return;
      const data = event.nativeEvent.data as any;
      try {
        // validate message and parse data
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (!parsedData || (!parsedData.topic && !parsedData.payload)) return;
        if (parsedData.topic === 'bg') {
          if (typeof parsedData.payload === 'string') {
            backgroundColor.value = parsedData.payload;
          }
        } else if (parsedData.topic === 'title') {
          title.current = parsedData.payload;
        } else {
          const m = currentMessenger.current;
          handleProviderRequestApp({
            messenger: m,
            data: parsedData,
            meta: {
              topic: 'providerRequest',
              sender: {
                url: m.url,
                tab: { id: tabId },
                title: title.current || tabStates[tabIndex].url,
              },
              id: parsedData.id,
            },
          });
        }

        // eslint-disable-next-line no-empty
      } catch (e) {
        console.error('Error parsing message', e);
      }
    },
    [isActiveTab, tabId, tabIndex, tabStates, title, backgroundColor]
  );

  const handleOnLoadStart = useCallback(
    (event: { nativeEvent: { url: string | URL; title: string } }) => {
      const { origin } = new URL(event.nativeEvent.url);

      if (!webViewRef.current) {
        return;
      }

      const messenger = appMessenger(webViewRef.current, tabId, origin);
      currentMessenger.current = messenger;
    },
    [tabId]
  );

  const handleOnLoad = useCallback((event: WebViewEvent) => {
    if (event.nativeEvent.loading) return;
    // placeholder
  }, []);

  const handleOnLoadEnd = useCallback(() => {
    return;
  }, []);

  const handleOnError = useCallback(() => {
    return;
  }, []);

  const handleShouldStartLoadWithRequest = useCallback(() => {
    return true;
  }, []);

  const loadProgress = useSharedValue(0);

  const progressBarStyle = useAnimatedStyle(() => {
    const animatedIsActiveTab = animatedActiveTabIndex?.value === tabIndex;

    return {
      display: animatedIsActiveTab ? 'flex' : 'none',
      opacity:
        tabViewVisible?.value || loadProgress.value === 1
          ? withSpring(0, SPRING_CONFIGS.snappierSpringConfig)
          : withSpring(1, SPRING_CONFIGS.snappierSpringConfig),
      width: loadProgress.value * deviceWidth,
    };
  });

  const handleOnLoadProgress = useCallback(
    ({ nativeEvent: { progress } }: { nativeEvent: { progress: number } }) => {
      if (loadProgress) {
        if (loadProgress.value === 1) loadProgress.value = 0;
        loadProgress.value = withTiming(progress, TIMING_CONFIGS.slowestFadeConfig);
      }
    },
    [loadProgress]
  );

  // Handles resetting the gesture scale after a tab is closed
  useEffect(() => {
    gestureScale.value = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex]);

  const WebviewComponent = () => (
    <Freeze
      freeze={!isActiveTab}
      placeholder={
        <Box
          style={[
            styles.webViewStyle,
            {
              height: WEBVIEW_HEIGHT,
            },
          ]}
        />
      }
    >
      <DappBrowserWebview
        webviewDebuggingEnabled={true}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        allowsInlineMediaPlayback
        allowsBackForwardNavigationGestures
        applicationNameForUserAgent={'Rainbow'}
        automaticallyAdjustContentInsets
        automaticallyAdjustsScrollIndicatorInsets={false}
        decelerationRate={'normal'}
        injectedJavaScript={getWebsiteBackgroundColorAndTitle}
        mediaPlaybackRequiresUserAction
        onLoadStart={handleOnLoadStart}
        // startInLoadingState
        onLoad={handleOnLoad}
        renderLoading={() => (
          <Box
            as={Animated.View}
            position="absolute"
            style={[{ height: '100%', flex: 1, width: '100%' }, animatedWebViewBackgroundColorStyle]}
            width="full"
          />
        )}
        onLoadEnd={handleOnLoadEnd}
        onError={handleOnError}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadProgress={handleOnLoadProgress}
        onMessage={handleOnMessage}
        onNavigationStateChange={handleNavigationStateChange}
        ref={webViewRef}
        source={{ uri: tabUrl || RAINBOW_HOME }}
        style={[styles.webViewStyle, styles.transparentBackground]}
      />
    </Freeze>
  );

  const TabContent = isOnHomepage ? <Homepage /> : <WebviewComponent />;

  const swipeToCloseTabGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, ctx: { startX?: number }) => {
      if (!tabViewVisible?.value) return;
      if (ctx.startX) {
        ctx.startX = undefined;
      }
    },
    onActive: (e, ctx: { startX?: number }) => {
      if (!tabViewVisible?.value) return;

      if (ctx.startX === undefined) {
        gestureScale.value = withTiming(1.1, TIMING_CONFIGS.tabPressConfig);
        gestureY.value = withTiming(-0.05 * (multipleTabsOpen ? TAB_VIEW_TAB_HEIGHT : 0), TIMING_CONFIGS.tabPressConfig);
        ctx.startX = e.absoluteX;
      }

      setNativeProps(scrollViewRef, { scrollEnabled: false });
      dispatchCommand(scrollViewRef, 'scrollTo', [0, scrollViewOffset?.value, true]);

      const xDelta = e.absoluteX - ctx.startX;
      gestureX.value = xDelta;
    },
    onEnd: (e, ctx: { startX?: number }) => {
      if (!tabViewVisible?.value) return;

      const xDelta = e.absoluteX - (ctx.startX || 0);
      setNativeProps(scrollViewRef, { scrollEnabled: !!tabViewVisible?.value });

      if ((xDelta < -(TAB_VIEW_COLUMN_WIDTH / 2 + 20) && e.velocityX <= 0) || e.velocityX < -500) {
        const xDestination = -Math.min(Math.max(deviceWidth * 1.25, Math.abs(e.velocityX * 0.3)), 1000);
        gestureX.value = withTiming(xDestination, TIMING_CONFIGS.tabPressConfig, () => {
          runOnJS(closeTab)(tabId);
          gestureScale.value = 0;
          gestureX.value = 0;
          gestureY.value = 0;
          ctx.startX = undefined;
        });
      } else {
        gestureScale.value = withTiming(1, TIMING_CONFIGS.tabPressConfig);
        gestureX.value = withTiming(0, TIMING_CONFIGS.tabPressConfig);
        gestureY.value = withTiming(0, TIMING_CONFIGS.tabPressConfig);
        ctx.startX = undefined;
      }
    },
  });

  const pressTabGestureHandler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: () => {
      if (tabViewVisible?.value) {
        toggleTabViewWorklet(tabIndex);
      }
    },
  });

  useAnimatedReaction(
    () => tabViewProgress?.value,
    (current, previous) => {
      // Monitor changes in tabViewProgress and trigger tab screenshot capture if necessary
      const changesDetected = previous && current !== previous;
      const isActiveTab = animatedActiveTabIndex?.value === tabIndex;

      if (isActiveTab && changesDetected && !isOnHomepage) {
        const enterTabViewAnimationIsComplete = tabViewVisible?.value === true && (previous || 0) > 100 && (current || 0) <= 100;
        const isPageLoaded = loadProgress.value > 0.2;

        if (!enterTabViewAnimationIsComplete || !isPageLoaded) return;

        const previousScreenshotExists = !!screenshotData.value?.uri;
        const tabIdChanged = screenshotData.value?.id !== tabId;
        const urlChanged = screenshotData.value?.url !== tabUrl;
        const oneMinuteAgo = Date.now() - 1000 * 60;
        const isScreenshotStale = screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo;

        const shouldCaptureScreenshot = !previousScreenshotExists || tabIdChanged || urlChanged || isScreenshotStale;

        if (shouldCaptureScreenshot) {
          runOnJS(captureAndSaveScreenshot)();
        }
      }
    }
  );

  return (
    <>
      {/* Need to fix some shadow performance issues - disabling shadows for now */}
      {/* <WebViewShadows gestureScale={gestureScale} isOnHomepage={isOnHomepage} tabIndex={tabIndex}> */}

      {/* @ts-expect-error Property 'children' does not exist on type */}
      <TapGestureHandler shouldCancelWhenOutside maxDeltaX={10} maxDeltaY={10} onGestureEvent={pressTabGestureHandler} ref={tapRef}>
        <Animated.View style={zIndexAnimatedStyle}>
          {/* @ts-expect-error Property 'children' does not exist on type */}
          <PanGestureHandler
            activeOffsetX={[-10, 10]}
            failOffsetY={[-10, 10]}
            maxPointers={1}
            onGestureEvent={swipeToCloseTabGestureHandler}
            ref={panRef}
            simultaneousHandlers={scrollViewRef}
            waitFor={tapRef}
          >
            <Animated.View style={[styles.webViewContainer, animatedWebViewStyle, animatedWebViewBackgroundColorStyle]}>
              <ViewShot options={{ format: 'jpg' }} ref={viewShotRef}>
                <View collapsable={false} style={{ height: WEBVIEW_HEIGHT, width: '100%' }}>
                  {TabContent}
                </View>
              </ViewShot>
              <Box
                as={Animated.View}
                style={[
                  styles.webViewStyle,
                  pointerEventsStyle,
                  {
                    height: WEBVIEW_HEIGHT,
                    left: 0,
                    position: 'absolute',
                    top: 0,
                    zIndex: 20000,
                  },
                ]}
              >
                <AnimatedFasterImage source={screenshotSource} style={[styles.screenshotContainerStyle, animatedScreenshotStyle]} />
              </Box>
              <WebViewBorder enabled={IS_IOS && isDarkMode && !isOnHomepage} tabIndex={tabIndex} />
              <CloseTabButton onPress={() => closeTab(tabId)} tabIndex={tabIndex} />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>

      {/* Need to fix some shadow performance issues - disabling shadows for now */}
      {/* </WebViewShadows> */}

      <Box as={Animated.View} style={[styles.progressBar, styles.centerAlign]}>
        <Box
          as={Animated.View}
          style={[progressBarStyle, { backgroundColor: accentColor }, styles.progressBar, { position: 'relative', top: 0 }]}
        />
      </Box>
    </>
  );
});

const styles = StyleSheet.create({
  centerAlign: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    borderRadius: 1,
    height: 2,
    top: WEBVIEW_HEIGHT + safeAreaInsetValues.top + 88 - 2,
    left: 0,
    width: deviceUtils.dimensions.width,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 9999999999,
  },
  screenshotContainerStyle: {
    height: WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    resizeMode: 'contain',
    top: 0,
    width: deviceUtils.dimensions.width,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    alignSelf: 'center',
    height: WEBVIEW_HEIGHT,
    overflow: 'hidden',
    position: 'absolute',
    top: safeAreaInsetValues.top,
    width: deviceUtils.dimensions.width,
    zIndex: 999999999,
  },
  webViewContainerShadowLarge: IS_IOS
    ? {
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      }
    : {},
  webViewContainerShadowLargeDark: IS_IOS
    ? {
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }
    : {},
  webViewContainerShadowSmall: IS_IOS
    ? {
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      }
    : {},
  webViewContainerShadowSmallDark: IS_IOS
    ? {
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      }
    : {},
  webViewStyle: {
    borderCurve: 'continuous',
    height: WEBVIEW_HEIGHT,
    maxHeight: WEBVIEW_HEIGHT,
    minHeight: WEBVIEW_HEIGHT,
    width: deviceUtils.dimensions.width,
  },
});
