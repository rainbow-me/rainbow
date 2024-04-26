/* eslint-disable @typescript-eslint/no-explicit-any */
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import { globalColors, useColorMode } from '@/design-system';
import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  SharedValue,
  convertToRGBA,
  dispatchCommand,
  interpolate,
  isColor,
  runOnJS,
  runOnUI,
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

import { Freeze } from 'react-freeze';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  INVERTED_MULTI_TAB_SCALE,
  INVERTED_SINGLE_TAB_SCALE,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_ROW_HEIGHT,
  TOP_INSET,
  WEBVIEW_HEIGHT,
} from './Dimensions';
import { WebViewEvent } from 'react-native-webview/lib/WebViewTypes';
import { appMessenger } from '@/browserMessaging/AppMessenger';
import { IS_ANDROID, IS_DEV, IS_IOS } from '@/env';
import { RainbowError, logger } from '@/logger';
import { CloseTabButton, X_BUTTON_PADDING, X_BUTTON_SIZE } from './CloseTabButton';
import DappBrowserWebview from './DappBrowserWebview';
import { Homepage } from './Homepage';
import { handleProviderRequestApp } from './handleProviderRequest';
import { WebViewBorder } from './WebViewBorder';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '../animations/animationConfigs';
import { TAB_SCREENSHOT_FASTER_IMAGE_CONFIG, RAINBOW_HOME, DEFAULT_TAB_URL, TAB_SCREENSHOT_FILE_FORMAT } from './constants';
import { getWebsiteMetadata } from './scripts';
import { normalizeUrlForRecents } from './utils';
import { useBrowserContext } from './BrowserContext';
import { BrowserTabProps, ScreenshotType } from './types';
import { findTabScreenshot, saveScreenshot } from './screenshots';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserWorkletsContext } from './BrowserWorkletsContext';

// ⚠️ TODO: Split this file apart into hooks, smaller components
// useTabScreenshots, useAnimatedWebViewStyles, useWebViewGestures

const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

export const BrowserTab = React.memo(function BrowserTab({ addRecent, injectedJS, setLogo, setTitle, tabId }: BrowserTabProps) {
  const {
    activeTabRef,
    animatedActiveTabIndex,
    animatedMultipleTabsOpen,
    animatedTabUrls,
    animatedWebViewHeight,
    currentlyOpenTabIds,
    loadProgress,
    scrollViewOffset,
    scrollViewRef,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();
  const { updateTabUrlWorklet } = useBrowserWorkletsContext();

  const isActiveTab = useBrowserStore(state => state.isTabActive(tabId));
  const tabUrl = useBrowserStore(state => state.getTabData?.(tabId)?.url) || DEFAULT_TAB_URL;
  const isOnHomepage = tabUrl === RAINBOW_HOME;

  const currentMessenger = useRef<any>(null);
  const title = useRef<string | null>(null);
  const logo = useRef<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot | null>(null);

  const gestureScale = useSharedValue(1);
  const gestureX = useSharedValue(0);

  const animatedTabIndex = useSharedValue(currentlyOpenTabIds.value.indexOf(tabId) === -1 ? 0 : currentlyOpenTabIds.value.indexOf(tabId));
  const screenshotData = useSharedValue<ScreenshotType | undefined>(findTabScreenshot(tabId, tabUrl) || undefined);

  const { isDarkMode } = useColorMode();
  const defaultBackgroundColor = isDarkMode ? '#191A1C' : globalColors.white100;
  const backgroundColor = useSharedValue<string>(defaultBackgroundColor);

  const safeBackgroundColor = useDerivedValue(() => {
    const homepageColor = isDarkMode ? globalColors.grey100 : '#FBFCFD';

    if (isOnHomepage) return homepageColor;
    if (!backgroundColor.value) return defaultBackgroundColor;

    if (isColor(backgroundColor.value)) {
      const rgbaColor = convertToRGBA(backgroundColor.value);

      if (rgbaColor[3] > 0.2 && rgbaColor[3] < 1) {
        // If the color is semi transparent
        return `rgba(${rgbaColor[0] * 255}, ${rgbaColor[1] * 255}, ${rgbaColor[2] * 255}, 1)`;
      } else if (rgbaColor[3] === 0) {
        // If the color is fully transparent
        return backgroundColor.value;
      } else if (rgbaColor[3] === 1) {
        // If the color is fully opaque
        return backgroundColor.value;
      } else return defaultBackgroundColor;
    } else {
      // If the color is not a valid color
      return defaultBackgroundColor;
    }
  }, [backgroundColor, isOnHomepage]);

  const animatedTabXPosition = useDerivedValue(() => {
    return withTiming(
      (animatedTabIndex.value % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2,
      TIMING_CONFIGS.tabPressConfig
    );
  }, [animatedTabIndex]);

  const animatedTabYPosition = useDerivedValue(() => {
    return withTiming(Math.floor(animatedTabIndex.value / 2) * TAB_VIEW_ROW_HEIGHT - 181, TIMING_CONFIGS.tabPressConfig);
  }, [animatedTabIndex]);

  const animatedWebViewBackgroundColorStyle = useAnimatedStyle(() => {
    return { backgroundColor: safeBackgroundColor.value };
  }, [safeBackgroundColor]);

  const animatedWebViewStyle = useAnimatedStyle(() => {
    const isTabBeingClosed = currentlyOpenTabIds.value.indexOf(tabId) === -1 && currentlyOpenTabIds.value.length !== 0;
    const animatedIsActiveTab = currentlyOpenTabIds.value.indexOf(tabId) !== -1 && animatedActiveTabIndex.value === animatedTabIndex.value;

    const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH;
    const scale = interpolate(
      tabViewProgress.value,
      [0, 100],
      [
        animatedIsActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH,
        0.7 - scaleDiff * (isTabBeingClosed ? 1 : animatedMultipleTabsOpen.value),
      ]
    );

    const xPositionStart = animatedIsActiveTab ? 0 : animatedTabXPosition.value;
    const xPositionEnd = (isTabBeingClosed ? 1 : animatedMultipleTabsOpen.value) * animatedTabXPosition.value;
    const xPositionForTab = interpolate(tabViewProgress.value, [0, 100], [xPositionStart, xPositionEnd]);

    const extraYPadding = 20;

    const yPositionStart =
      (animatedIsActiveTab ? 0 : animatedTabYPosition.value + extraYPadding) +
      (animatedIsActiveTab ? (1 - tabViewProgress.value / 100) * scrollViewOffset.value : 0);
    const yPositionEnd =
      (animatedTabYPosition.value + extraYPadding) * animatedMultipleTabsOpen.value +
      (animatedIsActiveTab ? (1 - tabViewProgress.value / 100) * scrollViewOffset.value : 0);
    const yPositionForTab = interpolate(tabViewProgress.value, [0, 100], [yPositionStart, yPositionEnd]);

    const opacity = interpolate(tabViewProgress.value, [0, 100], [animatedIsActiveTab ? 1 : 0, 1], 'clamp');

    return {
      opacity,
      transform: [{ translateX: xPositionForTab + gestureX.value }, { translateY: yPositionForTab }, { scale: scale * gestureScale.value }],
    };
  }, [
    animatedActiveTabIndex.value,
    animatedMultipleTabsOpen.value,
    animatedTabIndex.value,
    gestureX.value,
    gestureScale.value,
    tabViewProgress.value,
  ]);

  const expensiveAnimatedWebViewStyles = useAnimatedStyle(() => {
    const isTabBeingClosed = currentlyOpenTabIds.value.indexOf(tabId) === -1;
    const animatedIsActiveTab = !isTabBeingClosed && animatedActiveTabIndex.value === animatedTabIndex.value;

    // Determine the border radius for the minimized tab that
    // achieves concentric corners around the close button
    const invertedScaleDiff = INVERTED_SINGLE_TAB_SCALE - INVERTED_MULTI_TAB_SCALE;
    const invertedScale = INVERTED_SINGLE_TAB_SCALE - invertedScaleDiff * animatedMultipleTabsOpen.value;
    const spaceToXButton = invertedScale * X_BUTTON_PADDING;
    const xButtonBorderRadius = (X_BUTTON_SIZE / 2) * invertedScale;
    const tabViewBorderRadius = xButtonBorderRadius + spaceToXButton;

    const borderRadius = interpolate(
      tabViewProgress.value,
      [0, 100],
      // eslint-disable-next-line no-nested-ternary
      [animatedIsActiveTab ? (IS_ANDROID ? 0 : 16) : tabViewBorderRadius, tabViewBorderRadius],
      'clamp'
    );

    return {
      borderRadius,
      height: animatedIsActiveTab ? animatedWebViewHeight.value : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
      // eslint-disable-next-line no-nested-ternary
      pointerEvents: tabViewVisible.value ? 'auto' : animatedIsActiveTab ? 'auto' : 'none',
    };
  }, [animatedActiveTabIndex, animatedMultipleTabsOpen, animatedTabIndex, animatedWebViewHeight, tabViewProgress]);

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;
    const wasCloseButtonPressed = gestureScale.value === 1 && gestureX.value < 0;

    const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH;
    const scaleWeighting =
      gestureScale.value *
      interpolate(
        tabViewProgress.value,
        [0, 100],
        [animatedIsActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH, 0.7 - scaleDiff * animatedMultipleTabsOpen.value],
        'clamp'
      );
    const zIndex = scaleWeighting * (animatedIsActiveTab || gestureScale.value > 1 ? 9999 : 1) + (wasCloseButtonPressed ? 9999 : 0);

    return { zIndex };
  }, [animatedActiveTabIndex, animatedMultipleTabsOpen, animatedTabIndex, gestureScale, tabViewProgress]);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      // // Set the logo if it's not already set to the current website's logo
      // if (tabState.logoUrl !== logo.current) {
      //   updateActiveTabState?.(
      //     {
      //       logoUrl: logo.current,
      //     },
      //     tabId
      //   );
      // }

      if (navState.url) {
        runOnUI(updateTabUrlWorklet)(navState.url, tabId);
      }

      // ⚠️ TODO: Reintegrate canGoBack/canGoForward and figure out what we still need here

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

      // example:
      // sv.modify((value) => {
      //   'worklet';
      //   value.push(1000); // ✅
      //   return value;
      // });

      // if (navState.url !== tabUrl) {
      // if (animatedTabUrl) animatedTabUrl.value = navState.url;
      //   if (navState.navigationType !== 'other') {
      //     // If the URL DID ✅ change and navigationType !== 'other', we update the full tab state
      //     updateActiveTabState?.(
      //       {
      //         canGoBack: navState.canGoBack,
      //         canGoForward: navState.canGoForward,
      //         logoUrl: logo.current,
      //         // url: navState.url,
      //       },
      //       tabId
      //     );
      //   } else {
      //     // If the URL DID ✅ change and navigationType === 'other', we update only canGoBack and canGoForward
      //     updateActiveTabState?.(
      //       {
      //         canGoBack: navState.canGoBack,
      //         canGoForward: navState.canGoForward,
      //         logoUrl: logo.current,
      //       },
      //       tabId
      //     );
      //   }
      // } else {
      //   // If the URL DID NOT ❌ change, we update only canGoBack and canGoForward
      //   // This handles WebView reloads and cases where the WebView navigation state legitimately resets
      //   updateActiveTabState?.(
      //     {
      //       canGoBack: navState.canGoBack,
      //       canGoForward: navState.canGoForward,
      //       logoUrl: logo.current,
      //     },
      //     tabId
      //   );
      // }
    },
    [/* tabUrl, updateActiveTabState, */ tabId, updateTabUrlWorklet]
  );

  // useLayoutEffect seems to more reliably assign the ref correctly
  useLayoutEffect(() => {
    if (webViewRef.current !== null && isActiveTab) {
      activeTabRef.current = webViewRef.current;
      if (title.current) {
        // @ts-expect-error Property 'title' does not exist on type 'WebView<{}>'
        activeTabRef.current.title = title.current;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabRef, isActiveTab, isOnHomepage, tabId]);

  const saveScreenshotToFileSystem = useCallback(
    async (tempUri: string, tabId: string, timestamp: number, url: string) => {
      const screenshotWithRNFSPath = await saveScreenshot(tempUri, tabId, timestamp, url);
      if (!screenshotWithRNFSPath) return;
      screenshotData.value = screenshotWithRNFSPath;
    },
    [screenshotData]
  );

  const captureAndSaveScreenshot = useCallback(
    (pageUrl: string) => {
      if (viewShotRef.current && webViewRef.current) {
        const captureRef = viewShotRef.current;

        if (captureRef && captureRef?.capture) {
          captureRef
            .capture()
            .then(uri => {
              const timestamp = Date.now();
              saveScreenshotToFileSystem(uri, tabId, timestamp, pageUrl);
            })
            .catch(error => {
              logger.error(new RainbowError('Failed to capture tab screenshot'), {
                error: error.message,
              });
            });
        }
      }
    },
    [saveScreenshotToFileSystem, tabId]
  );

  const screenshotSource = useDerivedValue(() => {
    return {
      ...TAB_SCREENSHOT_FASTER_IMAGE_CONFIG,
      url: screenshotData.value?.uri ? `file://${screenshotData.value?.uri}` : '',
    } as ImageOptions;
  });

  const animatedScreenshotStyle = useAnimatedStyle(() => {
    const screenshotExists = !!screenshotData.value?.uri;
    const screenshotMatchesTabIdAndUrl = screenshotData.value?.id === tabId && screenshotData.value?.url === animatedTabUrls.value[tabId];
    const animatedIsActiveTab = animatedTabIndex.value === animatedActiveTabIndex.value && isActiveTab;

    // This is to handle the case where a WebView that wasn't previously the active tab
    // is made active from the tab view. Because its freeze state is driven by JS state,
    // it doesn't unfreeze immediately, so this condition allows some time for the tab to
    // become unfrozen before the screenshot is hidden, in most cases hiding the flash of
    // the frozen empty WebView that occurs if the screenshot is hidden immediately.
    const isActiveTabButMaybeStillFrozen = animatedIsActiveTab && tabViewProgress.value > 75 && !tabViewVisible.value;

    const oneMinuteAgo = Date.now() - 1000 * 60;
    const isScreenshotStale = !!(screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo);
    const shouldWaitForNewScreenshot = isScreenshotStale && tabViewVisible.value && animatedIsActiveTab && !isActiveTabButMaybeStillFrozen;

    const shouldDisplay =
      screenshotExists &&
      screenshotMatchesTabIdAndUrl &&
      (!animatedIsActiveTab || ((tabViewVisible.value || isActiveTabButMaybeStillFrozen) && !shouldWaitForNewScreenshot));

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

        if (parsedData.topic === 'websiteMetadata') {
          const { bgColor, logoUrl, pageTitle } = parsedData.payload;

          if (bgColor && typeof bgColor === 'string') {
            backgroundColor.value = bgColor;
          }
          if (logoUrl && typeof logoUrl === 'string') {
            logo.current = logoUrl;
            setLogo(logoUrl, tabId);
          } else {
            // Clear the logo in case the website has changed
            logo.current = '';
            setLogo('', tabId);
          }
          if (pageTitle && typeof pageTitle === 'string') {
            title.current = pageTitle;
            setTitle(pageTitle, tabId);
          }

          addRecent({
            url: normalizeUrlForRecents(tabUrl),
            name: pageTitle,
            image: logoUrl,
            timestamp: Date.now(),
          });
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
                title: title.current || tabUrl,
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
    [addRecent, backgroundColor, isActiveTab, setLogo, setTitle, tabId, tabUrl]
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

  useAnimatedReaction(
    () => tabViewProgress.value,
    (current, previous) => {
      // Monitor changes in tabViewProgress and trigger tab screenshot capture if necessary
      const changesDetected = isActiveTab && previous && current !== previous;
      const isTabBeingClosed = isActiveTab && currentlyOpenTabIds.value.indexOf(tabId) === -1;

      // Note: Using the JS-side isActiveTab because this should be in sync with the WebView freeze state,
      // which is driven by isActiveTab. This should allow screenshots slightly more time to capture.
      if (changesDetected && !isTabBeingClosed) {
        // ⚠️ TODO: Need to rewrite the enterTabViewAnimationIsComplete condition, because it assumes the
        // tab animation will overshoot and rebound. If the animation config is changed, it's possible the
        // screenshot condition won't be met.
        const enterTabViewAnimationIsComplete = tabViewVisible.value === true && previous > 100 && current <= 100;
        const isPageLoaded = loadProgress.value > 0.2;
        const isHomepage = animatedTabUrls.value[tabId] === RAINBOW_HOME;

        if (enterTabViewAnimationIsComplete && isPageLoaded && !isHomepage && animatedTabUrls.value[tabId]) {
          const previousScreenshotExists = !!screenshotData.value?.uri;
          const tabIdChanged = screenshotData.value?.id !== tabId;
          const urlChanged = screenshotData.value?.url !== animatedTabUrls.value[tabId];
          const oneMinuteAgo = Date.now() - 1000 * 60;
          const isScreenshotStale = screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo;

          const shouldCaptureScreenshot = !previousScreenshotExists || tabIdChanged || urlChanged || isScreenshotStale;

          if (shouldCaptureScreenshot) {
            runOnJS(captureAndSaveScreenshot)(animatedTabUrls.value[tabId]);
          }
        }
      }

      const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;

      if (animatedIsActiveTab && changesDetected && !isTabBeingClosed) {
        // If necessary, invisibly scroll to the currently active tab when the tab view is fully closed
        const isScrollViewScrollable = currentlyOpenTabIds.value.length > 4;
        const exitTabViewAnimationIsComplete =
          isScrollViewScrollable && tabViewVisible.value === false && current === 0 && previous && previous !== 0;

        if (exitTabViewAnimationIsComplete && isScrollViewScrollable) {
          const currentTabRow = Math.floor(animatedTabIndex.value / 2);
          const scrollViewHeight =
            Math.ceil(currentlyOpenTabIds.value.length / 2) * TAB_VIEW_ROW_HEIGHT +
            safeAreaInsetValues.bottom +
            165 +
            28 +
            (IS_IOS ? 0 : 35);

          const screenHeight = deviceUtils.dimensions.height;
          const halfScreenHeight = screenHeight / 2;
          const tabCenterPosition = currentTabRow * TAB_VIEW_ROW_HEIGHT + (currentTabRow - 1) * 28 + TAB_VIEW_ROW_HEIGHT / 2 + 37;

          let scrollPositionToCenterCurrentTab;

          if (scrollViewHeight <= screenHeight) {
            // No need to scroll if all tabs fit on the screen
            scrollPositionToCenterCurrentTab = 0;
          } else if (tabCenterPosition <= halfScreenHeight) {
            // Scroll to top if the tab is too near to the top of the scroll view to be centered
            scrollPositionToCenterCurrentTab = 0;
          } else if (tabCenterPosition + halfScreenHeight >= scrollViewHeight) {
            // Scroll to bottom if the tab is too near to the end of the scroll view to be centered
            scrollPositionToCenterCurrentTab = scrollViewHeight - screenHeight;
          } else {
            // Otherwise, vertically center the tab on the screen
            scrollPositionToCenterCurrentTab = tabCenterPosition - halfScreenHeight;
          }

          dispatchCommand(scrollViewRef, 'scrollTo', [0, scrollPositionToCenterCurrentTab, false]);
        }
      }
    }
  );

  useAnimatedReaction(
    () => ({ currentlyOpenTabIds: currentlyOpenTabIds.value }),
    current => {
      const currentIndex = current.currentlyOpenTabIds?.indexOf(tabId) ?? -1;
      // This allows us to give the tab its previous animated index when it's being closed, so that the close
      // animation is allowed to complete with the X and Y coordinates it had based on its last real index.
      if (currentIndex >= 0) {
        animatedTabIndex.value = currentIndex;
      }
    }
  );

  return (
    <>
      {/* Need to fix some shadow performance issues - disabling shadows for now */}
      {/* <WebViewShadows gestureScale={gestureScale} isOnHomepage={isOnHomepage} tabIndex={tabIndex}> */}

      <Animated.View style={zIndexAnimatedStyle}>
        <Animated.View entering={FadeIn.duration(160)} style={[styles.webViewContainer, animatedWebViewStyle]}>
          <Animated.View
            style={[styles.webViewExpensiveStylesContainer, expensiveAnimatedWebViewStyles, animatedWebViewBackgroundColorStyle]}
          >
            <ViewShot options={TAB_SCREENSHOT_FILE_FORMAT} ref={viewShotRef}>
              <View collapsable={false} style={styles.viewShotContainer}>
                {isOnHomepage ? (
                  <Homepage />
                ) : (
                  <Freeze freeze={!isActiveTab}>
                    <DappBrowserWebview
                      allowsBackForwardNavigationGestures
                      allowsInlineMediaPlayback
                      applicationNameForUserAgent="Rainbow"
                      automaticallyAdjustContentInsets
                      automaticallyAdjustsScrollIndicatorInsets={false}
                      decelerationRate="normal"
                      fraudulentWebsiteWarningEnabled
                      injectedJavaScript={getWebsiteMetadata}
                      injectedJavaScriptBeforeContentLoaded={injectedJS.current || ''}
                      mediaPlaybackRequiresUserAction
                      onError={handleOnError}
                      onLoad={handleOnLoad}
                      onLoadStart={handleOnLoadStart}
                      onLoadEnd={handleOnLoadEnd}
                      onLoadProgress={handleOnLoadProgress}
                      onMessage={handleOnMessage}
                      onNavigationStateChange={handleNavigationStateChange}
                      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                      originWhitelist={['*']}
                      pullToRefreshEnabled
                      ref={webViewRef}
                      // 👇 This eliminates a white flash and prevents the WebView from hiding its content on load/reload
                      renderLoading={() => <></>}
                      source={{ uri: tabUrl }}
                      style={styles.webViewStyle}
                      webviewDebuggingEnabled={IS_DEV}
                    />
                  </Freeze>
                )}
              </View>
            </ViewShot>
            <AnimatedFasterImage
              source={IS_IOS ? screenshotSource : screenshotSource.value}
              style={[styles.screenshotContainerStyle, animatedScreenshotStyle]}
            />
            <WebViewBorder
              animatedTabIndex={animatedTabIndex}
              enabled={IS_IOS && isDarkMode && !isOnHomepage}
              tabViewProgress={tabViewProgress}
              tabViewVisible={tabViewVisible}
              animatedActiveTabIndex={animatedActiveTabIndex}
            />
          </Animated.View>
          <TabGestureHandlers
            animatedTabIndex={animatedTabIndex}
            gestureScale={gestureScale}
            gestureX={gestureX}
            isOnHomepage={isOnHomepage}
            tabId={tabId}
          />
        </Animated.View>
      </Animated.View>

      {/* Need to fix some shadow performance issues - disabling shadows for now */}
      {/* </WebViewShadows> */}
    </>
  );
});

interface TabGestureHandlerProps {
  animatedTabIndex: SharedValue<number>;
  gestureScale: SharedValue<number>;
  gestureX: SharedValue<number>;
  isOnHomepage: boolean;
  tabId: string;
}

const TabGestureHandlers = React.memo(function TabGestureHandlers({
  animatedTabIndex,
  gestureScale,
  gestureX,
  isOnHomepage,
  tabId,
}: TabGestureHandlerProps) {
  const { currentlyBeingClosedTabIds, currentlyOpenTabIds, multipleTabsOpen, scrollViewRef, tabViewVisible } = useBrowserContext();
  const { closeTabWorklet, toggleTabViewWorklet } = useBrowserWorkletsContext();

  const animatedGestureHandlerStyle = useAnimatedStyle(() => {
    const shouldActivate = tabViewVisible.value;
    return { display: shouldActivate ? 'flex' : 'none', pointerEvents: shouldActivate ? 'auto' : 'none' };
  }, [tabViewVisible.value]);

  const swipeToCloseTabGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, ctx: { startX?: number | undefined }) => {
      if (!tabViewVisible.value) return;
      if (ctx.startX) {
        ctx.startX = undefined;
      }
    },
    onActive: (e, ctx: { startX?: number | undefined }) => {
      if (!tabViewVisible.value) return;

      if (ctx.startX === undefined) {
        gestureScale.value = withTiming(1.1, TIMING_CONFIGS.tabPressConfig);
        ctx.startX = e.absoluteX;
      }

      const xDelta = e.absoluteX - ctx.startX;
      gestureX.value = xDelta;
      setNativeProps(scrollViewRef, { scrollEnabled: false });
    },
    onEnd: (e, ctx: { startX?: number | undefined }) => {
      const xDelta = e.absoluteX - (ctx.startX || 0);
      setNativeProps(scrollViewRef, { scrollEnabled: tabViewVisible.value });

      const isBeyondDismissThreshold = xDelta < -(TAB_VIEW_COLUMN_WIDTH / 2 + 20) && e.velocityX <= 0;
      const isFastLeftwardSwipe = e.velocityX < -500;
      const isEmptyState = !multipleTabsOpen.value && isOnHomepage;

      const shouldDismiss = tabViewVisible.value && !isEmptyState && (isBeyondDismissThreshold || isFastLeftwardSwipe);

      if (shouldDismiss) {
        const xDestination = -Math.min(Math.max(DEVICE_WIDTH, DEVICE_WIDTH + Math.abs(e.velocityX * 0.2)), 1200);
        // Store the tab's index before modifying currentlyOpenTabIds, so we can pass it along to closeTabWorklet()
        const storedTabIndex = animatedTabIndex.value;

        // Initiate tab closing logic
        currentlyOpenTabIds.modify(openTabs => {
          const index = openTabs.indexOf(tabId);
          if (index !== -1) {
            currentlyBeingClosedTabIds.modify(closingTabs => {
              closingTabs.push(tabId);
              return closingTabs;
            });
            openTabs.splice(index, 1);
          }
          return openTabs;
        });

        gestureX.value = withTiming(xDestination, TIMING_CONFIGS.tabPressConfig, () => {
          // Ensure the tab remains hidden after being swiped off screen (until the tab is destroyed)
          gestureScale.value = 0;

          // Because the animation is complete we know the tab is off screen and can be safely destroyed
          currentlyBeingClosedTabIds.modify(closingTabs => {
            const index = closingTabs.indexOf(tabId);
            if (index !== -1) {
              closingTabs.splice(index, 1);
            }
            return closingTabs;
          });
          closeTabWorklet(tabId, storedTabIndex);
        });
      } else {
        gestureScale.value = withTiming(1, TIMING_CONFIGS.tabPressConfig);
        gestureX.value = withTiming(0, TIMING_CONFIGS.tabPressConfig);
        ctx.startX = undefined;
      }
    },
  });

  const pressTabGestureHandler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onActive: () => {
      if (tabViewVisible.value) {
        toggleTabViewWorklet(animatedTabIndex.value);
      }
    },
  });

  return (
    <>
      <Animated.View style={animatedGestureHandlerStyle}>
        {/* @ts-expect-error Property 'children' does not exist on type */}
        <TapGestureHandler maxDeltaX={10} maxDeltaY={10} onGestureEvent={pressTabGestureHandler} shouldCancelWhenOutside>
          <Animated.View>
            {/* @ts-expect-error Property 'children' does not exist on type */}
            <PanGestureHandler
              activeOffsetX={[-5, 5]}
              failOffsetY={[-10, 10]}
              maxPointers={1}
              onGestureEvent={swipeToCloseTabGestureHandler}
              simultaneousHandlers={scrollViewRef}
            >
              <Animated.View style={styles.gestureHandlersContainer}></Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
      <CloseTabButton
        animatedTabIndex={animatedTabIndex}
        gestureScale={gestureScale}
        gestureX={gestureX}
        isOnHomepage={isOnHomepage}
        tabId={tabId}
      />
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
  gestureHandlersContainer: {
    borderCurve: 'continuous',
    height: COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
    left: 0,
    position: 'absolute',
    overflow: 'hidden',
    top: 0,
    width: deviceUtils.dimensions.width,
    zIndex: 50000,
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
  viewShotContainer: {
    height: WEBVIEW_HEIGHT,
    width: DEVICE_WIDTH,
  },
  webViewContainer: {
    height: WEBVIEW_HEIGHT,
    overflow: 'hidden',
    pointerEvents: 'box-none',
    position: 'absolute',
    top: TOP_INSET,
    width: deviceUtils.dimensions.width,
  },
  webViewExpensiveStylesContainer: {
    borderCurve: 'continuous',
    height: WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    overflow: 'hidden',
    top: 0,
    width: deviceUtils.dimensions.width,
  },
  webViewStyle: {
    backgroundColor: 'transparent',
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
