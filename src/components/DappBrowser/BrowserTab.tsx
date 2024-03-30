/* eslint-disable @typescript-eslint/no-explicit-any */
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import { Box, globalColors, useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import React, { useCallback, useLayoutEffect, useRef } from 'react';
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
import { IS_ANDROID, IS_DEV, IS_IOS } from '@/env';
import { CloseTabButton, X_BUTTON_PADDING, X_BUTTON_SIZE } from './CloseTabButton';
import DappBrowserWebview from './DappBrowserWebview';
import Homepage from './Homepage';
import { handleProviderRequestApp } from './handleProviderRequest';
import { WebViewBorder } from './WebViewBorder';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '../animations/animationConfigs';
import { FASTER_IMAGE_CONFIG } from './constants';
import { RainbowError, logger } from '@/logger';
import { isEmpty } from 'lodash';

// ⚠️ TODO: Split this file apart into hooks, smaller components
// useTabScreenshots, useAnimatedWebViewStyles, useWebViewGestures

interface BrowserTabProps {
  tabId: string;
  tabIndex: number;
  injectedJS: string;
}

interface ScreenshotType {
  id: string; // <- the tab uniqueId
  timestamp: number; // <- time of capture
  uri: string; // <- screenshot file name = `screenshot-${timestamp}.jpg`
  url: string; // <- url of the tab
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
        logger.error(new RainbowError('Screenshot data is malformed — expected array'), {
          screenshots: JSON.stringify(screenshots, null, 2),
        });
      } catch (e: any) {
        logger.error(new RainbowError('Screenshot data is malformed — error stringifying'), {
          message: e.message,
        });
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
};

const deletePrunedScreenshotFiles = async (allScreenshots: ScreenshotType[], screenshotsToKeep: ScreenshotType[]): Promise<void> => {
  try {
    const filesToDelete = allScreenshots.filter(screenshot => !screenshotsToKeep.includes(screenshot));
    const deletePromises = filesToDelete.map(screenshot => {
      const filePath = `${RNFS.DocumentDirectoryPath}/${screenshot.uri}`;
      return RNFS.unlink(filePath).catch(e => {
        logger.error(new RainbowError('Error deleting screenshot file'), {
          message: e.message,
          filePath,
          screenshot: JSON.stringify(screenshot, null, 2),
        });
      });
    });
    await Promise.all(deletePromises);
  } catch (e: any) {
    logger.error(new RainbowError('Screenshot file pruning operation failed to complete'), {
      message: e.message,
    });
  }
};

const getWebsiteBackgroundColorAndTitle = `
  const bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
  let appleTouchIconHref = document.querySelector("link[rel='apple-touch-icon']")?.getAttribute('href');
  if (appleTouchIconHref && !appleTouchIconHref.startsWith('http')) {
    appleTouchIconHref = window.location.origin + appleTouchIconHref;
  }
  window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "bg", payload: bgColor}));
  window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "title", payload: document.title }));
  window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "logo", payload: appleTouchIconHref }));
  true;
  `;

export const BrowserTab = React.memo(function BrowserTab({ tabId, tabIndex, injectedJS }: BrowserTabProps) {
  const {
    activeTabIndex,
    activeTabRef,
    animatedActiveTabIndex,
    closeTab,
    loadProgress,
    scrollViewRef,
    scrollViewOffset,
    tabStates,
    tabViewProgress,
    tabViewVisible,
    toggleTabViewWorklet,
    updateActiveTabState,
    webViewRefs,
  } = useBrowserContext();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();

  const currentMessenger = useRef<any>(null);
  const title = useRef<string | null>(null);
  const logo = useRef<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot | null>(null);

  const panRef = useRef();
  const tapRef = useRef();

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

  const tabUrl = tabStates?.[tabIndex]?.url;
  const isActiveTab = activeTabIndex === tabIndex;
  const multipleTabsOpen = tabStates?.length > 1;
  const isOnHomepage = tabUrl === RAINBOW_HOME;
  const isEmptyState = !multipleTabsOpen && isOnHomepage;
  const isLogoUnset = tabStates[tabIndex]?.logoUrl === undefined;

  const screenshotData = useSharedValue<ScreenshotType | undefined>(findTabScreenshot(tabId, tabUrl) || undefined);

  const defaultBackgroundColor = isDarkMode ? '#191A1C' : globalColors.white100;
  const backgroundColor = useSharedValue<string>(defaultBackgroundColor);

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
    // For some reason driving the WebView height with a separate derived
    // value results in slightly less tearing when the height animates
    const animatedIsActiveTab = animatedActiveTabIndex?.value === tabIndex;
    if (!animatedIsActiveTab) return COLLAPSED_WEBVIEW_HEIGHT_UNSCALED;

    const progress = tabViewProgress?.value || 0;

    return interpolate(
      progress,
      [0, 100],
      [animatedIsActiveTab ? WEBVIEW_HEIGHT : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED],
      'clamp'
    );
  });

  const animatedWebViewStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === tabIndex;

    const scale = interpolate(
      progress,
      [0, 100],
      [animatedIsActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, multipleTabsOpen ? TAB_VIEW_COLUMN_WIDTH / deviceWidth : 0.7]
    );

    const xPositionStart = animatedIsActiveTab ? 0 : (tabIndex % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2;
    const xPositionEnd = multipleTabsOpen ? (tabIndex % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2 : 0;
    const xPositionForTab = interpolate(progress, [0, 100], [xPositionStart, xPositionEnd]);

    const extraYPadding = 20;

    const yPositionStart =
      (animatedIsActiveTab ? 0 : Math.floor(tabIndex / 2) * TAB_VIEW_ROW_HEIGHT + extraYPadding) +
      (animatedIsActiveTab ? (1 - progress / 100) * (scrollViewOffset?.value || 0) : 0);
    const yPositionEnd =
      (multipleTabsOpen ? Math.floor(tabIndex / 2) * TAB_VIEW_ROW_HEIGHT + extraYPadding : 0) +
      (animatedIsActiveTab ? (1 - progress / 100) * (scrollViewOffset?.value || 0) : 0);
    const yPositionForTab = interpolate(progress, [0, 100], [yPositionStart, yPositionEnd]);

    // Determine the border radius for the minimized tab that
    // achieves concentric corners around the close button
    const invertedScale = multipleTabsOpen ? INVERTED_MULTI_TAB_SCALE : INVERTED_SINGLE_TAB_SCALE;
    const spaceToXButton = invertedScale * X_BUTTON_PADDING;
    const xButtonBorderRadius = (X_BUTTON_SIZE / 2) * invertedScale;
    const tabViewBorderRadius = xButtonBorderRadius + spaceToXButton;

    const borderRadius = interpolate(
      progress,
      [0, 100],
      // eslint-disable-next-line no-nested-ternary
      [animatedIsActiveTab ? (IS_ANDROID ? 0 : 16) : tabViewBorderRadius, tabViewBorderRadius],
      'clamp'
    );

    const opacity = interpolate(progress, [0, 100], [animatedIsActiveTab ? 1 : 0, 1], 'clamp');

    return {
      borderRadius,
      height: animatedWebViewHeight.value,
      opacity,
      // eslint-disable-next-line no-nested-ternary
      pointerEvents: tabViewVisible?.value ? 'box-only' : animatedIsActiveTab ? 'auto' : 'none',
      transform: [
        { translateY: multipleTabsOpen ? -animatedWebViewHeight.value / 2 : 0 },
        { translateX: xPositionForTab + gestureX.value },
        { translateY: yPositionForTab + gestureY.value },
        { scale: scale * gestureScale.value },
        { translateY: multipleTabsOpen ? animatedWebViewHeight.value / 2 : 0 },
      ],
    };
  });

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === tabIndex;

    const scaleWeighting =
      gestureScale.value *
      interpolate(
        progress,
        [0, 100],
        [animatedIsActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, multipleTabsOpen ? TAB_VIEW_COLUMN_WIDTH / deviceWidth : 0.7],
        'clamp'
      );
    const zIndex = scaleWeighting * (animatedIsActiveTab || gestureScale.value > 1 ? 9999 : 1);

    return { zIndex };
  });

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      // Set the logo if it's not already set for the current website
      // ⚠️ TODO: Modify this to check against the root domain or subdomain+domain
      if ((isLogoUnset && !isEmpty(logo.current)) || navState.url !== tabStates[tabIndex].url) {
        updateActiveTabState(
          {
            logoUrl: logo.current,
          },
          tabId
        );
      }

      // To prevent infinite redirect loops, we only update the URL if both of these are true:
      //
      // 1) the WebView's URL is different from the tabStates URL
      // 2) the navigationType !== 'other', which gets triggered repeatedly in certain cases programatically
      //
      // This has the consequence of the tabStates page URL not always being updated when navigating within
      // single-page apps, which we'll need to figure out a solution for, but it's an okay workaround for now.
      //
      // It has the benefit though of allowing navigation within single-page apps without triggering reloads
      // due to the WebView's URL being altered (which happens when its source prop is updated).
      //
      // Additionally, the canGoBack/canGoForward states can become out of sync with the actual WebView state
      // if they aren't set according to the logic below. There's likely a cleaner way to structure it, but
      // this avoids setting back/forward states under the wrong conditions or more than once per event.
      //
      // To observe what's actually going on, you can import the navigationStateLogger helper and add it here.

      if (navState.url !== tabStates[tabIndex].url) {
        if (navState.navigationType !== 'other') {
          // If the URL DID ✅ change and navigationType !== 'other', we update the full tab state
          updateActiveTabState(
            {
              canGoBack: navState.canGoBack,
              canGoForward: navState.canGoForward,
              url: navState.url,
            },
            tabId
          );
        } else {
          // If the URL DID ✅ change and navigationType === 'other', we update only canGoBack and canGoForward
          updateActiveTabState(
            {
              canGoBack: navState.canGoBack,
              canGoForward: navState.canGoForward,
            },
            tabId
          );
        }
      } else {
        // If the URL DID NOT ❌ change, we update only canGoBack and canGoForward
        // This handles WebView reloads and cases where the WebView navigation state legitimately resets
        updateActiveTabState(
          {
            canGoBack: navState.canGoBack,
            canGoForward: navState.canGoForward,
          },
          tabId
        );
      }
    },
    [isLogoUnset, tabId, logo, tabIndex, tabStates, updateActiveTabState]
  );

  // useLayoutEffect seems to more reliably assign the ref correctly
  useLayoutEffect(() => {
    if (webViewRef.current !== null && isActiveTab) {
      webViewRefs.current[tabIndex] = webViewRef.current;
      activeTabRef.current = webViewRef.current;
    }

    const currentWebviewRef = webViewRefs.current;

    return () => {
      currentWebviewRef[tabIndex] = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveTab, isOnHomepage, tabId, tabIndex, webViewRefs]);

  const saveScreenshotToFileSystem = useCallback(
    async (tempUri: string, tabId: string, timestamp: number, url: string) => {
      const fileName = `screenshot-${timestamp}.jpg`;
      try {
        await RNFS.copyFile(tempUri, `${RNFS.DocumentDirectoryPath}/${fileName}`);
        // Once the file is copied, build the screenshot object
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
      } catch (e: any) {
        logger.error(new RainbowError('Error saving tab screenshot to file system'), {
          message: e.message,
          screenshotData: {
            tempUri,
            tabId,
            url,
          },
        });
      }
    },
    [screenshotData]
  );

  const captureAndSaveScreenshot = useCallback(() => {
    if (viewShotRef.current && webViewRef.current) {
      const captureRef = viewShotRef.current;

      if (captureRef && captureRef?.capture) {
        captureRef
          .capture()
          .then(uri => {
            const timestamp = Date.now();
            saveScreenshotToFileSystem(uri, tabId, timestamp, tabStates[tabIndex].url);
          })
          .catch(error => {
            logger.error(new RainbowError('Failed to capture tab screenshot'), {
              error: error.message,
            });
          });
      }
    }
  }, [saveScreenshotToFileSystem, tabId, tabIndex, tabStates, viewShotRef]);

  const screenshotSource = useDerivedValue(() => {
    return {
      ...FASTER_IMAGE_CONFIG,
      url: screenshotData.value?.uri ? `file://${screenshotData.value?.uri}` : '',
    } as ImageOptions;
  });

  const animatedScreenshotStyle = useAnimatedStyle(() => {
    const animatedIsActiveTab = animatedActiveTabIndex?.value === tabIndex;
    const screenshotExists = !!screenshotData.value?.uri;
    const screenshotMatchesTabIdAndUrl = screenshotData.value?.id === tabId && screenshotData.value?.url === tabStates[tabIndex].url;

    // This is to handle the case where a WebView that wasn't previously the active tab
    // is made active from the tab view. Because its freeze state is driven by JS state,
    // it doesn't unfreeze immediately, so this condition allows some time for the tab to
    // become unfrozen before the screenshot is hidden, in most cases hiding the flash of
    // the frozen empty WebView that occurs if the screenshot is hidden immediately.
    const isActiveTabButMaybeStillFrozen = animatedIsActiveTab && (tabViewProgress?.value || 0) > 50 && !tabViewVisible?.value;

    const oneMinuteAgo = Date.now() - 1000 * 60;
    const isScreenshotStale = screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo;
    const shouldWaitForNewScreenshot =
      isScreenshotStale && animatedIsActiveTab && !!tabViewVisible?.value && !isActiveTabButMaybeStillFrozen;

    const shouldDisplay =
      screenshotExists &&
      screenshotMatchesTabIdAndUrl &&
      (!animatedIsActiveTab || !!tabViewVisible?.value || isActiveTabButMaybeStillFrozen) &&
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
        } else if (parsedData.topic === 'logo') {
          logo.current = parsedData.payload;
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

  const handleOnLoadProgress = useCallback(
    ({ nativeEvent: { progress } }: { nativeEvent: { progress: number } }) => {
      if (loadProgress) {
        if (loadProgress.value === 1) loadProgress.value = 0;
        loadProgress.value = withTiming(progress, TIMING_CONFIGS.slowestFadeConfig);
      }
    },
    [loadProgress]
  );

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
      const xDelta = e.absoluteX - (ctx.startX || 0);
      setNativeProps(scrollViewRef, { scrollEnabled: !!tabViewVisible?.value });

      const isBeyondDismissThreshold = xDelta < -(TAB_VIEW_COLUMN_WIDTH / 2 + 20) && e.velocityX <= 0;
      const isFastLeftwardSwipe = e.velocityX < -500;

      const shouldDismiss = !!tabViewVisible?.value && !isEmptyState && (isBeyondDismissThreshold || isFastLeftwardSwipe);

      if (shouldDismiss) {
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
        const isPageLoaded = (loadProgress?.value || 0) > 0.2;

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
                  {isOnHomepage ? (
                    <Homepage />
                  ) : (
                    <Freeze freeze={!isActiveTab}>
                      <DappBrowserWebview
                        webviewDebuggingEnabled={IS_DEV}
                        injectedJavaScriptBeforeContentLoaded={injectedJS}
                        allowsInlineMediaPlayback
                        fraudulentWebsiteWarningEnabled
                        allowsBackForwardNavigationGestures
                        applicationNameForUserAgent={'Rainbow'}
                        automaticallyAdjustContentInsets
                        automaticallyAdjustsScrollIndicatorInsets={false}
                        decelerationRate={'normal'}
                        injectedJavaScript={getWebsiteBackgroundColorAndTitle}
                        mediaPlaybackRequiresUserAction
                        onLoadStart={handleOnLoadStart}
                        onLoad={handleOnLoad}
                        // 👇 This prevents an occasional white page flash when loading
                        renderLoading={() => (
                          <Box
                            as={Animated.View}
                            position="absolute"
                            style={[{ height: WEBVIEW_HEIGHT, flex: 1 }, animatedWebViewBackgroundColorStyle]}
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
                  )}
                </View>
              </ViewShot>
              <AnimatedFasterImage source={screenshotSource} style={[styles.screenshotContainerStyle, animatedScreenshotStyle]} />
              <WebViewBorder enabled={IS_IOS && isDarkMode && !isOnHomepage} tabIndex={tabIndex} />
              <CloseTabButton onPress={() => closeTab(tabId)} tabIndex={tabIndex} />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>

      {/* Need to fix some shadow performance issues - disabling shadows for now */}
      {/* </WebViewShadows> */}
    </>
  );
});

const styles = StyleSheet.create({
  backupScreenshotStyleOverrides: {
    zIndex: -1,
  },
  centerAlign: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotContainerStyle: {
    height: WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    resizeMode: 'contain',
    top: 0,
    width: deviceUtils.dimensions.width,
    zIndex: 20000,
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
  webViewStyle: {
    borderCurve: 'continuous',
    height: WEBVIEW_HEIGHT,
    maxHeight: WEBVIEW_HEIGHT,
    minHeight: WEBVIEW_HEIGHT,
    width: deviceUtils.dimensions.width,
  },
  // Need to fix some shadow performance issues - disabling shadows for now
  // webViewContainerShadowLarge: IS_IOS
  //   ? {
  //       shadowColor: globalColors.grey100,
  //       shadowOffset: { width: 0, height: 8 },
  //       shadowOpacity: 0.1,
  //       shadowRadius: 12,
  //     }
  //   : {},
  // webViewContainerShadowLargeDark: IS_IOS
  //   ? {
  //       shadowColor: globalColors.grey100,
  //       shadowOffset: { width: 0, height: 8 },
  //       shadowOpacity: 0.3,
  //       shadowRadius: 12,
  //     }
  //   : {},
  // webViewContainerShadowSmall: IS_IOS
  //   ? {
  //       shadowColor: globalColors.grey100,
  //       shadowOffset: { width: 0, height: 2 },
  //       shadowOpacity: 0.04,
  //       shadowRadius: 3,
  //     }
  //   : {},
  // webViewContainerShadowSmallDark: IS_IOS
  //   ? {
  //       shadowColor: globalColors.grey100,
  //       shadowOffset: { width: 0, height: 2 },
  //       shadowOpacity: 0.2,
  //       shadowRadius: 3,
  //     }
  //   : {},
});
