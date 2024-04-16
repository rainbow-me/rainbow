/* eslint-disable @typescript-eslint/no-explicit-any */
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import { globalColors, useColorMode } from '@/design-system';
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
  FadeIn,
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

import { Freeze } from 'react-freeze';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  INVERTED_MULTI_TAB_SCALE,
  INVERTED_SINGLE_TAB_SCALE,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_ROW_HEIGHT,
  TAB_VIEW_TAB_HEIGHT,
  TOP_INSET,
  WEBVIEW_HEIGHT,
} from './Dimensions';
import { WebViewEvent } from 'react-native-webview/lib/WebViewTypes';
import { appMessenger } from '@/browserMessaging/AppMessenger';
import { IS_ANDROID, IS_DEV, IS_IOS } from '@/env';
import { RainbowError, logger } from '@/logger';
import { CloseTabButton, X_BUTTON_PADDING, X_BUTTON_SIZE } from './CloseTabButton';
import DappBrowserWebview from './DappBrowserWebview';
import Homepage from './Homepage';
import { handleProviderRequestApp } from './handleProviderRequest';
import { WebViewBorder } from './WebViewBorder';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '../animations/animationConfigs';
import { TAB_SCREENSHOT_FASTER_IMAGE_CONFIG, RAINBOW_HOME } from './constants';
import { getWebsiteMetadata } from './scripts';
import { useBrowserHistoryStore } from '@/state/browserHistory';
import { normalizeUrlForRecents } from './utils';
import { useBrowserContext } from './BrowserContext';
import { BrowserTabProps, ScreenshotType } from './types';
import { findTabeScreenshot, saveScreenshot } from './screenshots';

// ⚠️ TODO: Split this file apart into hooks, smaller components
// useTabScreenshots, useAnimatedWebViewStyles, useWebViewGestures

const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

export const BrowserTab = React.memo(function BrowserTab({ activeTab, tabIndex, injectedJS, ...props }: BrowserTabProps) {
  const { uniqueId: tabId } = activeTab;
  console.log('BrowserTab :: RENDER', tabId);
  const {
    activeTabIndex,
    activeTabRef,
    animatedActiveTabIndex,
    closeTabWorklet,
    currentlyOpenTabIds,
    tabViewVisible,
    toggleTabViewWorklet,
    updateActiveTabState,
    tabViewProgress,
    tabsCount,
    nextTabId,
  } = props;
  const { scrollViewRef, scrollViewOffset, loadProgress } = useBrowserContext();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const { addRecent } = useBrowserHistoryStore();

  const currentMessenger = useRef<any>(null);
  const title = useRef<string | null>(null);
  const logo = useRef<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot | null>(null);

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

  const tabUrl = activeTab.url;
  const isActiveTab = activeTabIndex === tabIndex;
  const isOnHomepage = tabUrl === RAINBOW_HOME;

  const animatedTabIndex = useSharedValue(
    (currentlyOpenTabIds?.value.indexOf(tabId) === -1
      ? currentlyOpenTabIds?.value.length - 1
      : currentlyOpenTabIds?.value.indexOf(tabId)) ?? 0
  );
  const screenshotData = useSharedValue<ScreenshotType | undefined>(findTabeScreenshot(tabId, tabUrl) || undefined);

  const defaultBackgroundColor = isDarkMode ? '#191A1C' : globalColors.white100;
  const backgroundColor = useSharedValue<string>(defaultBackgroundColor);

  const animatedTabXPosition = useDerivedValue(() => {
    return withTiming(
      (animatedTabIndex.value % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2,
      TIMING_CONFIGS.tabPressConfig
    );
  });

  const animatedTabYPosition = useDerivedValue(() => {
    return withTiming(Math.floor(animatedTabIndex.value / 2) * TAB_VIEW_ROW_HEIGHT, TIMING_CONFIGS.tabPressConfig);
  });

  const multipleTabsOpen = useDerivedValue(() => {
    // The purpose of the following checks is to prevent jarring visual shifts when the tab view transitions
    // from having a single tab to multiple tabs. When a second tab is created, it takes a moment for
    // tabStates to catch up to currentlyOpenTabIds, and this check prevents the single tab from shifting
    // due to currentlyOpenTabIds updating before the new tab component is rendered via tabStates.
    const isFirstTab = currentlyOpenTabIds?.value.indexOf(tabId) === 0;
    const shouldTwoTabsExist = currentlyOpenTabIds?.value.length === 2;

    const isTransitioningFromSingleToMultipleTabs =
      isFirstTab && shouldTwoTabsExist && (tabsCount === 1 || (tabsCount === 2 && currentlyOpenTabIds?.value[1] !== nextTabId));

    const multipleTabsExist = !!(currentlyOpenTabIds?.value && currentlyOpenTabIds?.value.length > 1);
    const isLastOrSecondToLastTabAndExiting = currentlyOpenTabIds?.value?.indexOf(tabId) === -1 && currentlyOpenTabIds.value.length === 1;
    const multipleTabsOpen = (multipleTabsExist && !isTransitioningFromSingleToMultipleTabs) || isLastOrSecondToLastTabAndExiting;

    return multipleTabsOpen;
  });

  const animatedMultipleTabsOpen = useDerivedValue(() => {
    return withTiming(multipleTabsOpen.value ? 1 : 0, TIMING_CONFIGS.tabPressConfig);
  });

  const animatedWebViewBackgroundColorStyle = useAnimatedStyle(() => {
    const homepageColor = isDarkMode ? globalColors.grey100 : '#FBFCFD';

    if (isOnHomepage) return { backgroundColor: homepageColor };
    if (!backgroundColor.value) return { backgroundColor: defaultBackgroundColor };
    if (isColor(backgroundColor.value)) {
      const rgbaColor = convertToRGBA(backgroundColor.value);

      if (rgbaColor[3] < 1 && rgbaColor[3] !== 0) {
        return { backgroundColor: `rgba(${rgbaColor[0] * 255}, ${rgbaColor[1] * 255}, ${rgbaColor[2] * 255}, 1)` };
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
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex.value;
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
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex.value;
    const isTabBeingClosed = currentlyOpenTabIds?.value?.indexOf(tabId) === -1;

    const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / deviceWidth;
    const scale = interpolate(
      progress,
      [0, 100],
      [animatedIsActiveTab && !isTabBeingClosed ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, 0.7 - scaleDiff * animatedMultipleTabsOpen.value]
    );

    const xPositionStart = animatedIsActiveTab ? 0 : animatedTabXPosition.value;
    const xPositionEnd = animatedMultipleTabsOpen.value * animatedTabXPosition.value;
    const xPositionForTab = interpolate(progress, [0, 100], [xPositionStart, xPositionEnd]);

    const extraYPadding = 20;

    const yPositionStart =
      (animatedIsActiveTab ? 0 : animatedTabYPosition.value + extraYPadding) +
      (animatedIsActiveTab ? (1 - progress / 100) * (scrollViewOffset?.value || 0) : 0);
    const yPositionEnd =
      (animatedTabYPosition.value + extraYPadding) * animatedMultipleTabsOpen.value +
      (animatedIsActiveTab ? (1 - progress / 100) * (scrollViewOffset?.value || 0) : 0);
    const yPositionForTab = interpolate(progress, [0, 100], [yPositionStart, yPositionEnd]);

    // Determine the border radius for the minimized tab that
    // achieves concentric corners around the close button
    const invertedScaleDiff = INVERTED_SINGLE_TAB_SCALE - INVERTED_MULTI_TAB_SCALE;
    const invertedScale = INVERTED_SINGLE_TAB_SCALE - invertedScaleDiff * animatedMultipleTabsOpen.value;
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
      pointerEvents: tabViewVisible?.value ? 'auto' : animatedIsActiveTab ? 'auto' : 'none',
      transform: [
        { translateY: animatedMultipleTabsOpen.value * (-animatedWebViewHeight.value / 2) },
        { translateX: xPositionForTab + gestureX.value },
        { translateY: yPositionForTab + gestureY.value },
        { scale: scale * gestureScale.value },
        { translateY: animatedMultipleTabsOpen.value * (animatedWebViewHeight.value / 2) },
      ],
    };
  });

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex.value;
    const wasCloseButtonPressed = gestureScale.value === 1 && gestureX.value < 0;

    const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / deviceWidth;
    const scaleWeighting =
      gestureScale.value *
      interpolate(
        progress,
        [0, 100],
        [animatedIsActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / deviceWidth, 0.7 - scaleDiff * animatedMultipleTabsOpen.value],
        'clamp'
      );
    const zIndex = scaleWeighting * (animatedIsActiveTab || gestureScale.value > 1 ? 9999 : 1) + (wasCloseButtonPressed ? 9999 : 0);

    return { zIndex };
  });

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      // Set the logo if it's not already set to the current website's logo
      if (activeTab.logoUrl !== logo.current) {
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

      if (navState.url !== activeTab.url) {
        if (navState.navigationType !== 'other') {
          // If the URL DID ✅ change and navigationType !== 'other', we update the full tab state
          updateActiveTabState(
            {
              canGoBack: navState.canGoBack,
              canGoForward: navState.canGoForward,
              logoUrl: logo.current,
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
              logoUrl: logo.current,
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
            logoUrl: logo.current,
          },
          tabId
        );
      }
    },
    [activeTab.logoUrl, activeTab.url, tabId, updateActiveTabState]
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

  const captureAndSaveScreenshot = useCallback(() => {
    if (viewShotRef.current && webViewRef.current) {
      const captureRef = viewShotRef.current;

      if (captureRef && captureRef?.capture) {
        captureRef
          .capture()
          .then(uri => {
            const timestamp = Date.now();
            saveScreenshotToFileSystem(uri, tabId, timestamp, activeTab.url);
          })
          .catch(error => {
            logger.error(new RainbowError('Failed to capture tab screenshot'), {
              error: error.message,
            });
          });
      }
    }
  }, [activeTab.url, saveScreenshotToFileSystem, tabId]);

  const screenshotSource = useDerivedValue(() => {
    return {
      ...TAB_SCREENSHOT_FASTER_IMAGE_CONFIG,
      url: screenshotData.value?.uri ? `file://${screenshotData.value?.uri}` : '',
    } as ImageOptions;
  });

  const animatedScreenshotStyle = useAnimatedStyle(() => {
    // Note: We use isActiveTab throughout this animated style over animatedIsActiveTab
    // because the displaying of the screenshot should be synced to the WebView freeze
    // state, which is driven by the slower JS-side isActiveTab. This prevents the
    // screenshot from disappearing before the WebView is unfrozen.

    const screenshotExists = !!screenshotData.value?.uri;
    const screenshotMatchesTabIdAndUrl = screenshotData.value?.id === tabId && screenshotData.value?.url === activeTab.url;

    // This is to handle the case where a WebView that wasn't previously the active tab
    // is made active from the tab view. Because its freeze state is driven by JS state,
    // it doesn't unfreeze immediately, so this condition allows some time for the tab to
    // become unfrozen before the screenshot is hidden, in most cases hiding the flash of
    // the frozen empty WebView that occurs if the screenshot is hidden immediately.
    const isActiveTabButMaybeStillFrozen = isActiveTab && (tabViewProgress?.value || 0) > 75 && !tabViewVisible?.value;

    const oneMinuteAgo = Date.now() - 1000 * 60;
    const isScreenshotStale = !!(screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo);
    const shouldWaitForNewScreenshot = isScreenshotStale && !!tabViewVisible?.value && isActiveTab && !isActiveTabButMaybeStillFrozen;

    const shouldDisplay =
      screenshotExists &&
      screenshotMatchesTabIdAndUrl &&
      (!isActiveTab || !!tabViewVisible?.value || isActiveTabButMaybeStillFrozen) &&
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

        if (parsedData.topic === 'websiteMetadata') {
          const { bgColor, logoUrl, pageTitle } = parsedData.payload;

          if (bgColor && typeof bgColor === 'string') {
            backgroundColor.value = bgColor;
          }
          if (logoUrl && typeof logoUrl === 'string') {
            logo.current = logoUrl;
          }
          if (pageTitle && typeof pageTitle === 'string') {
            title.current = pageTitle;
          }

          addRecent({
            url: normalizeUrlForRecents(activeTab.url),
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
                title: title.current || activeTab.url,
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
    [isActiveTab, addRecent, activeTab.url, backgroundColor, tabId]
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
        gestureY.value = withTiming(-0.05 * (animatedMultipleTabsOpen.value * TAB_VIEW_TAB_HEIGHT), TIMING_CONFIGS.tabPressConfig);
        ctx.startX = e.absoluteX;
      }

      const xDelta = e.absoluteX - ctx.startX;
      gestureX.value = xDelta;
      setNativeProps(scrollViewRef, { scrollEnabled: false });
    },
    onEnd: (e, ctx: { startX?: number }) => {
      const xDelta = e.absoluteX - (ctx.startX || 0);
      setNativeProps(scrollViewRef, { scrollEnabled: !!tabViewVisible?.value });

      const isBeyondDismissThreshold = xDelta < -(TAB_VIEW_COLUMN_WIDTH / 2 + 20) && e.velocityX <= 0;
      const isFastLeftwardSwipe = e.velocityX < -500;
      const isEmptyState = !multipleTabsOpen.value && isOnHomepage;

      const shouldDismiss = !!tabViewVisible?.value && !isEmptyState && (isBeyondDismissThreshold || isFastLeftwardSwipe);

      if (shouldDismiss) {
        const xDestination = -Math.min(Math.max(deviceWidth, deviceWidth + Math.abs(e.velocityX * 0.2)), 1200);
        // Store the tab's index before modifying currentlyOpenTabIds, so we can pass it along to closeTabWorklet()
        const storedTabIndex = animatedTabIndex.value;
        // Remove the tab from currentlyOpenTabIds as soon as the swipe-to-close gesture is confirmed
        currentlyOpenTabIds?.modify(value => {
          const index = value.indexOf(tabId);
          if (index !== -1) {
            value.splice(index, 1);
          }
          return value;
        });
        gestureX.value = withTiming(xDestination, TIMING_CONFIGS.tabPressConfig, () => {
          // Ensure the tab remains hidden after being swiped off screen (until the tab is destroyed)
          gestureScale.value = 0;
          // Because the animation is complete we know the tab is off screen and can be safely destroyed
          closeTabWorklet(tabId, storedTabIndex);
        });

        // In the event two tabs are open when this one is closed, we animate its Y position to align it
        // vertically with the remaining tab as this tab exits and the remaining tab scales up.
        const isLastOrSecondToLastTabAndExiting =
          currentlyOpenTabIds?.value?.indexOf(tabId) === -1 && currentlyOpenTabIds.value.length === 1;
        if (isLastOrSecondToLastTabAndExiting) {
          const existingYTranslation = gestureY.value;
          const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / deviceWidth;
          gestureY.value = withTiming(existingYTranslation + scaleDiff * COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, TIMING_CONFIGS.tabPressConfig);
        }
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
        toggleTabViewWorklet(animatedTabIndex.value);
      }
    },
  });

  useAnimatedReaction(
    () => tabViewProgress?.value,
    (current, previous) => {
      // Monitor changes in tabViewProgress and trigger tab screenshot capture if necessary
      const changesDetected = previous && current !== previous;
      const isTabBeingClosed = currentlyOpenTabIds?.value?.indexOf(tabId) === -1;

      // Note: Using the JS-side isActiveTab because this should be in sync with the WebView freeze state,
      // which is driven by isActiveTab. This should allow screenshots slightly more time to capture.
      if (isActiveTab && changesDetected && !isTabBeingClosed) {
        // ⚠️ TODO: Need to rewrite the enterTabViewAnimationIsComplete condition, because it assumes the
        // tab animation will overshoot and rebound. If the animation config is changed, it's possible the
        // screenshot condition won't be met.
        const enterTabViewAnimationIsComplete = tabViewVisible?.value === true && (previous || 0) > 100 && (current || 0) <= 100;
        const isPageLoaded = (loadProgress?.value || 0) > 0.2;

        if (enterTabViewAnimationIsComplete && isPageLoaded && !isOnHomepage) {
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

        // If necessary, invisibly scroll to the currently active tab when the tab view is fully closed
        const isScrollViewScrollable = (currentlyOpenTabIds?.value.length || 0) > 4;
        const exitTabViewAnimationIsComplete =
          isScrollViewScrollable && tabViewVisible?.value === false && current === 0 && previous && previous !== 0;

        if (exitTabViewAnimationIsComplete && isScrollViewScrollable) {
          const currentTabRow = Math.floor(animatedTabIndex.value / 2);
          const scrollViewHeight =
            Math.ceil((currentlyOpenTabIds?.value.length || 0) / 2) * TAB_VIEW_ROW_HEIGHT +
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
    () => ({ currentlyOpenTabIds: currentlyOpenTabIds?.value }),
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

      {/* @ts-expect-error Property 'children' does not exist on type */}
      <TapGestureHandler maxDeltaX={10} maxDeltaY={10} onGestureEvent={pressTabGestureHandler} shouldCancelWhenOutside>
        <Animated.View entering={FadeIn.duration(160)} style={zIndexAnimatedStyle}>
          {/* @ts-expect-error Property 'children' does not exist on type */}
          <PanGestureHandler
            activeOffsetX={[-10, 10]}
            failOffsetY={[-10, 10]}
            maxPointers={1}
            onGestureEvent={swipeToCloseTabGestureHandler}
            simultaneousHandlers={scrollViewRef}
          >
            <Animated.View style={[styles.webViewContainer, animatedWebViewStyle, animatedWebViewBackgroundColorStyle]}>
              <ViewShot options={{ format: 'jpg' }} ref={viewShotRef}>
                <View collapsable={false} style={{ height: WEBVIEW_HEIGHT, width: '100%' }}>
                  {isOnHomepage ? (
                    <Homepage updateActiveTabState={updateActiveTabState} />
                  ) : (
                    <Freeze freeze={!isActiveTab}>
                      <DappBrowserWebview
                        webviewDebuggingEnabled={IS_DEV}
                        injectedJavaScriptBeforeContentLoaded={injectedJS.current || ''}
                        allowsInlineMediaPlayback
                        fraudulentWebsiteWarningEnabled
                        allowsBackForwardNavigationGestures
                        applicationNameForUserAgent={'Rainbow'}
                        automaticallyAdjustContentInsets
                        automaticallyAdjustsScrollIndicatorInsets={false}
                        decelerationRate={'normal'}
                        injectedJavaScript={getWebsiteMetadata}
                        mediaPlaybackRequiresUserAction
                        onLoadStart={handleOnLoadStart}
                        onLoad={handleOnLoad}
                        // 👇 This eliminates a white flash and prevents the WebView from hiding its content on load/reload
                        renderLoading={() => <></>}
                        onLoadEnd={handleOnLoadEnd}
                        onError={handleOnError}
                        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                        onLoadProgress={handleOnLoadProgress}
                        onMessage={handleOnMessage}
                        onNavigationStateChange={handleNavigationStateChange}
                        originWhitelist={['*']}
                        ref={webViewRef}
                        source={{ uri: tabUrl || RAINBOW_HOME }}
                        style={styles.webViewStyle}
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
              <CloseTabButton
                animatedMultipleTabsOpen={animatedMultipleTabsOpen}
                animatedTabIndex={animatedTabIndex}
                gestureScale={gestureScale}
                gestureX={gestureX}
                gestureY={gestureY}
                isOnHomepage={isOnHomepage}
                multipleTabsOpen={multipleTabsOpen}
                tabId={tabId}
                animatedActiveTabIndex={animatedActiveTabIndex}
                closeTabWorklet={closeTabWorklet}
                currentlyOpenTabIds={currentlyOpenTabIds}
                tabViewProgress={tabViewProgress}
                tabViewVisible={tabViewVisible}
              />
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
  webViewContainer: {
    alignSelf: 'center',
    height: WEBVIEW_HEIGHT,
    overflow: 'hidden',
    position: 'absolute',
    top: TOP_INSET,
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
