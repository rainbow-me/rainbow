/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Freeze } from 'react-freeze';
import { StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  AnimatedStyle,
  DerivedValue,
  FadeIn,
  SharedValue,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView, { WebViewMessageEvent, WebViewNavigation, WebViewProps } from 'react-native-webview';
import { WebViewEvent } from 'react-native-webview/lib/WebViewTypes';
import { appMessenger } from '@/browserMessaging/AppMessenger';
import { globalColors, useColorMode } from '@/design-system';
import { IS_DEV, IS_IOS } from '@/env';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useBrowserStore } from '@/state/browser/browserStore';
import { Site } from '@/state/browserHistory';
import { getDappHostname } from '@/utils/connectedApps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { AnimatedFasterImage } from '../AnimatedComponents/AnimatedFasterImage';
import { TIMING_CONFIGS } from '../animations/animationConfigs';
import { useBrowserContext } from './BrowserContext';
import { useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { CloseTabButton } from './CloseTabButton';
import { WebViewShadows } from './DappBrowserShadows';
import DappBrowserWebview from './DappBrowserWebview';
import { COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, EXTRA_WEBVIEW_HEIGHT, TAB_VIEW_COLUMN_WIDTH, TOP_INSET, WEBVIEW_HEIGHT } from './Dimensions';
import { ErrorPage } from './ErrorPage';
import { Homepage } from './Homepage';
import { WebViewBorder } from './WebViewBorder';
import {
  RAINBOW_HOME,
  TAB_SCREENSHOT_FILE_FORMAT,
  TAB_SCREENSHOT_FASTER_IMAGE_CONFIG,
  USER_AGENT,
  USER_AGENT_APPLICATION_NAME,
} from './constants';
import { handleProviderRequestApp } from './handleProviderRequest';
import { useAnimatedTab } from './hooks/useAnimatedTab';
import { useTabScreenshotProvider } from './hooks/useTabScreenshotProvider';
import { freezeWebsite, getWebsiteMetadata, unfreezeWebsite } from './scripts';
import { BrowserTabProps, ScreenshotType } from './types';

export const BrowserTab = memo(function BrowserTab({ addRecent, setLogo, setTitle, tabId }: BrowserTabProps) {
  const { isDarkMode } = useColorMode();
  const viewShotRef = useRef<ViewShot | null>(null);

  const {
    animatedTabIndex,
    animatedWebViewBackgroundColorStyle,
    animatedWebViewStyle,
    backgroundColor,
    expensiveAnimatedWebViewStyles,
    gestureScale,
    gestureX,
    zIndexAnimatedStyle,
  } = useAnimatedTab({ tabId });

  return (
    <WebViewShadows tabId={tabId} zIndexAnimatedStyle={zIndexAnimatedStyle}>
      <Animated.View style={[styles.webViewContainer, animatedWebViewStyle, IS_IOS ? {} : zIndexAnimatedStyle]}>
        <Animated.View style={[styles.webViewExpensiveStylesContainer, expensiveAnimatedWebViewStyles]}>
          <ViewShot options={TAB_SCREENSHOT_FILE_FORMAT} ref={viewShotRef}>
            <Animated.View
              collapsable={false}
              entering={FadeIn.duration(160)}
              style={[styles.viewShotContainer, animatedWebViewBackgroundColorStyle]}
            >
              <HomepageOrWebView
                addRecent={addRecent}
                backgroundColor={backgroundColor}
                setLogo={setLogo}
                setTitle={setTitle}
                tabId={tabId}
                viewShotRef={viewShotRef}
              />
            </Animated.View>
          </ViewShot>
          <TabScreenshotContainer tabId={tabId} />
          <WebViewBorder enabled={IS_IOS && isDarkMode} tabId={tabId} />
        </Animated.View>
        <TabGestureHandlers animatedTabIndex={animatedTabIndex} gestureScale={gestureScale} gestureX={gestureX} tabId={tabId} />
      </Animated.View>
    </WebViewShadows>
  );
});

const HomepageOrWebView = ({
  addRecent,
  backgroundColor,
  setLogo,
  setTitle,
  tabId,
  viewShotRef,
}: {
  addRecent: (recent: Site) => void;
  backgroundColor: SharedValue<string>;
  setLogo: (logoUrl: string | undefined, tabId: string) => void;
  setTitle: (title: string | undefined, tabId: string) => void;
  tabId: string;
  viewShotRef: React.RefObject<ViewShot | null>;
}) => {
  const isOnHomepage = useBrowserStore(state => !state.getTabData?.(tabId)?.url || state.getTabData?.(tabId)?.url === RAINBOW_HOME);
  const { isDarkMode } = useColorMode();

  // Reset background color when returning to the homepage
  useEffect(() => {
    if (isOnHomepage) {
      backgroundColor.value = isDarkMode ? '#191A1C' : globalColors.white100;
    }
  }, [backgroundColor, isDarkMode, isOnHomepage]);

  return isOnHomepage ? (
    <Homepage tabId={tabId} />
  ) : (
    <FreezableWebView
      addRecent={addRecent}
      backgroundColor={backgroundColor}
      setLogo={setLogo}
      setTitle={setTitle}
      tabId={tabId}
      viewShotRef={viewShotRef}
    />
  );
};

/**
 * ### `TabScreenshotContainer`
 * This component gets the tab's `screenshotData` and its `animatedScreenshotStyle` via `useTabScreenshotProvider`,
 * which accesses the active state of the tab internally. This component isolates the resulting re-renders that
 * occur when the tab becomes active or inactive, and shields the `TabScreenshot` component and the screenshot
 * itself from unnecessarily re-rendering, since the props it passes down are stable.
 */
const TabScreenshotContainer = ({ tabId }: { tabId: string }) => {
  const { animatedScreenshotStyle, screenshotData } = useTabScreenshotProvider({ tabId });
  return <TabScreenshot animatedStyle={animatedScreenshotStyle} screenshotData={screenshotData} />;
};

const TabScreenshot = memo(function TabScreenshot({
  animatedStyle,
  screenshotData,
}: {
  animatedStyle: AnimatedStyle;
  screenshotData: DerivedValue<ScreenshotType | undefined>;
}) {
  const animatedProps = useAnimatedProps(() => {
    return {
      source: {
        ...TAB_SCREENSHOT_FASTER_IMAGE_CONFIG,
        url: screenshotData.value?.uri ? `file://${screenshotData.value.uri}` : '',
      },
    };
  });

  return (
    // ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error
    // @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps
    <AnimatedFasterImage animatedProps={animatedProps} style={[styles.screenshotContainerStyle, animatedStyle]} />
  );
});

const FreezableWebViewComponent = ({
  addRecent,
  backgroundColor,
  setLogo,
  setTitle,
  tabId,
  viewShotRef,
}: {
  addRecent: (recent: Site) => void;
  backgroundColor: SharedValue<string>;
  setLogo: (logoUrl: string | undefined, tabId: string) => void;
  setTitle: (title: string | undefined, tabId: string) => void;
  tabId: string;
  viewShotRef: React.RefObject<ViewShot | null>;
}) => {
  const { activeTabRef, loadProgress, resetScrollHandlers, screenshotCaptureRef } = useBrowserContext();
  const { updateTabUrlWorklet } = useBrowserWorkletsContext();
  const { setParams } = useNavigation();

  const currentMessengerRef = useRef<any>(null);
  const logoRef = useRef<string | null>(null);
  const titleRef = useRef<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const isActiveTab = useBrowserStore(state => state.isTabActive(tabId));
  const tabUrl = useBrowserStore(state => state.getTabData?.(tabId)?.url) || RAINBOW_HOME;
  const isOnHomepage = tabUrl === RAINBOW_HOME;

  const handleOnMessage = useCallback(
    (event: Partial<WebViewMessageEvent>) => {
      if (!useBrowserStore.getState().isTabActive(tabId)) return;

      const data = event.nativeEvent?.data as any;
      try {
        // validate message and parse data
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (!parsedData || (!parsedData.topic && !parsedData.payload)) return;

        if (IS_IOS && parsedData.topic === 'injectedUnderPageBackgroundColor') {
          const { underPageBackgroundColor } = parsedData.payload;

          if (underPageBackgroundColor && typeof underPageBackgroundColor === 'string') {
            backgroundColor.value = underPageBackgroundColor;
          }
        } else if (parsedData.topic === 'websiteMetadata') {
          const { bgColor, logoUrl, pageTitle } = parsedData.payload;

          if (!IS_IOS && bgColor && typeof bgColor === 'string') {
            backgroundColor.value = bgColor;
          }

          if (logoUrl && typeof logoUrl === 'string') {
            logoRef.current = logoUrl;
            setLogo(logoUrl, tabId);
          } else {
            logoRef.current = null;
            setLogo(undefined, tabId);
          }

          if (pageTitle && typeof pageTitle === 'string') {
            titleRef.current = pageTitle;
            setTitle(pageTitle, tabId);
          } else {
            titleRef.current = null;
            setTitle(undefined, tabId);
          }

          addRecent({
            url: tabUrl,
            name: pageTitle,
            image: logoUrl,
            timestamp: Date.now(),
          });
        } else {
          const m = currentMessengerRef.current;
          if (!m) return;

          handleProviderRequestApp({
            messenger: m,
            data: parsedData,
            meta: {
              topic: 'providerRequest',
              sender: {
                url: m.url,
                tab: { id: tabId },
                title: titleRef.current || tabUrl,
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
    [addRecent, backgroundColor, setLogo, setTitle, tabId, tabUrl]
  );

  const handleOnLoad = useCallback(
    (event: WebViewEvent) => {
      if (event.nativeEvent.loading) return;
      const { origin } = new URL(event.nativeEvent.url);

      if (typeof webViewRef !== 'function' && webViewRef.current) {
        if (!webViewRef.current) {
          return;
        }
        const messenger = appMessenger(webViewRef.current, tabId, origin);
        currentMessengerRef.current = messenger;
      }
    },
    [tabId, webViewRef]
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      if (request.url.startsWith('rainbow://wc') || request.url.startsWith('https://rnbwappdotcom.app.link/')) {
        Navigation.handleAction(Routes.NO_NEED_WC_SHEET, {});
        activeTabRef.current?.reload();
        return false;
      }
      return true;
    },
    [activeTabRef]
  );

  const handleOnLoadProgress = useCallback(
    ({ nativeEvent: { progress } }: { nativeEvent: { progress: number } }) => {
      runOnUI(() => {
        if (loadProgress.value === 1) loadProgress.value = 0;
        loadProgress.value = withTiming(progress, TIMING_CONFIGS.slowestFadeConfig);
      })();
    },
    [loadProgress]
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (navState.navigationType !== 'other' || getDappHostname(navState.url) === getDappHostname(tabUrl)) {
        runOnUI(updateTabUrlWorklet)({ tabId, url: navState.url });
      }
      useBrowserStore.getState().setNavState({ canGoBack: navState.canGoBack, canGoForward: navState.canGoForward }, tabId);
      resetScrollHandlers();
    },
    [resetScrollHandlers, tabId, tabUrl, updateTabUrlWorklet]
  );

  const handleOnOpenWindow = useCallback(
    (syntheticEvent: { nativeEvent: { targetUrl: string } }) => {
      const { nativeEvent } = syntheticEvent;
      const { targetUrl } = nativeEvent;
      setParams({ url: targetUrl });
    },
    [setParams]
  );

  const handleOnContentProcessDidTerminate = useCallback(() => {
    activeTabRef.current?.reload();
  }, [activeTabRef]);

  useEffect(() => {
    if (isActiveTab) {
      resetScrollHandlers();

      if (webViewRef.current) {
        activeTabRef.current = webViewRef.current;
        if (titleRef.current) {
          activeTabRef.current.title = titleRef.current;
        }
      }
    }
  }, [activeTabRef, isActiveTab, isOnHomepage, resetScrollHandlers, screenshotCaptureRef, webViewRef]);

  useEffect(() => {
    if (isActiveTab) screenshotCaptureRef.current = viewShotRef.current;

    // Freeze heavy website processes when the WebView is inactive
    if (webViewRef.current) {
      if (isActiveTab) {
        webViewRef.current.injectJavaScript(unfreezeWebsite);
      } else {
        webViewRef.current.injectJavaScript(freezeWebsite);
      }
    }
  }, [isActiveTab, screenshotCaptureRef, viewShotRef, webViewRef]);

  return (
    <Freeze freeze={!isActiveTab}>
      <TabWebView
        onContentProcessDidTerminate={handleOnContentProcessDidTerminate}
        onLoad={handleOnLoad}
        onLoadProgress={handleOnLoadProgress}
        onMessage={handleOnMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onRenderProcessGone={handleOnContentProcessDidTerminate}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        ref={webViewRef}
        source={{ uri: tabUrl }}
        onOpenWindow={handleOnOpenWindow}
      />
    </Freeze>
  );
};

const FreezableWebView = memo(React.forwardRef(FreezableWebViewComponent));

const TabWebViewComponent = (props: WebViewProps, ref: React.Ref<WebView>) => {
  const { onScrollWebView, onTouchEnd, onTouchMove, onTouchStart } = useBrowserContext();

  const shouldExpandWebView = useBrowserStore(state => state.shouldExpandWebView);

  return (
    <DappBrowserWebview
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      allowsBackForwardNavigationGestures
      allowsInlineMediaPlayback
      applicationNameForUserAgent={USER_AGENT_APPLICATION_NAME}
      automaticallyAdjustContentInsets
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentInset={{ bottom: 0, left: 0, right: 0, top: 0 }}
      decelerationRate="normal"
      fraudulentWebsiteWarningEnabled
      injectedJavaScript={getWebsiteMetadata}
      mediaPlaybackRequiresUserAction
      onScroll={IS_IOS ? onScrollWebView : undefined}
      onTouchEnd={IS_IOS ? onTouchEnd : undefined}
      onTouchMove={IS_IOS ? onTouchMove : undefined}
      onTouchStart={IS_IOS ? onTouchStart : undefined}
      originWhitelist={['*']}
      ref={ref}
      renderError={() => <ErrorPage />}
      renderLoading={() => <></>}
      style={[styles.webViewStyle, shouldExpandWebView ? styles.webViewStyleExpanded : {}]}
      userAgent={USER_AGENT[IS_IOS ? 'IOS' : 'ANDROID']}
      webviewDebuggingEnabled={IS_DEV}
    />
  );
};

const TabWebView = memo(React.forwardRef(TabWebViewComponent));

interface TabGestureHandlerProps {
  animatedTabIndex: SharedValue<number>;
  gestureScale: SharedValue<number>;
  gestureX: SharedValue<number>;
  tabId: string;
}

const TabGestureHandlers = ({ animatedTabIndex, gestureScale, gestureX, tabId }: TabGestureHandlerProps) => {
  const { animatedTabUrls, currentlyBeingClosedTabIds, currentlyOpenTabIds, multipleTabsOpen, tabViewVisible } = useBrowserContext();
  const { closeTabWorklet, toggleTabViewWorklet } = useBrowserWorkletsContext();

  const tapHandlerRef = useRef();

  const animatedGestureHandlerStyle = useAnimatedStyle(() => {
    const shouldActivate = tabViewVisible.value;
    return {
      pointerEvents: shouldActivate ? 'auto' : 'none',
    };
  });

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
    },
    onFail: (_, ctx: { startX?: number | undefined }) => {
      gestureScale.value = withTiming(1, TIMING_CONFIGS.tabPressConfig);
      gestureX.value = withTiming(0, TIMING_CONFIGS.tabPressConfig);
      ctx.startX = undefined;
    },
    onEnd: (e, ctx: { startX?: number | undefined }) => {
      const xDelta = e.absoluteX - (ctx.startX || 0);

      const isBeyondDismissThreshold = xDelta < -(TAB_VIEW_COLUMN_WIDTH / 2 + 20) && e.velocityX <= 0;
      const isFastLeftwardSwipe = e.velocityX < -500;
      const url = animatedTabUrls.value[tabId] || RAINBOW_HOME;
      const isEmptyState = !multipleTabsOpen.value && url === RAINBOW_HOME;

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
          closeTabWorklet({ tabId, tabIndex: storedTabIndex });
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
    onCancel: () => {
      return false;
    },
    onEnd: () => {
      return false;
    },
  });

  return (
    <>
      <Animated.View style={[styles.gestureHandlersContainer, animatedGestureHandlerStyle]}>
        <PanGestureHandler
          activeOffsetX={[-2, 2]}
          failOffsetY={[-12, 12]}
          maxPointers={1}
          onGestureEvent={swipeToCloseTabGestureHandler}
          waitFor={tapHandlerRef}
        >
          <Animated.View style={styles.gestureHandlersContainer}>
            <TapGestureHandler
              maxDeltaX={10}
              maxDeltaY={10}
              onGestureEvent={pressTabGestureHandler}
              ref={tapHandlerRef}
              shouldCancelWhenOutside
            >
              <Animated.View style={styles.gestureHandlersContainer} />
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
      <CloseTabButton animatedTabIndex={animatedTabIndex} gestureScale={gestureScale} gestureX={gestureX} tabId={tabId} />
    </>
  );
};

const styles = StyleSheet.create({
  gestureHandlersContainer: {
    height: COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
    width: DEVICE_WIDTH,
  },
  screenshotContainerStyle: {
    height: WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    resizeMode: 'contain',
    top: 0,
    width: DEVICE_WIDTH,
    zIndex: 20000,
  },
  viewShotContainer: {
    height: WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT,
    width: DEVICE_WIDTH,
  },
  webViewContainer: {
    height: WEBVIEW_HEIGHT,
    overflow: 'visible',
    pointerEvents: 'box-none',
    position: 'absolute',
    top: TOP_INSET,
    width: DEVICE_WIDTH,
  },
  webViewExpensiveStylesContainer: {
    borderCurve: 'continuous',
    height: WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    overflow: 'hidden',
    width: DEVICE_WIDTH,
  },
  webViewStyle: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    height: WEBVIEW_HEIGHT,
    maxHeight: WEBVIEW_HEIGHT,
    minHeight: WEBVIEW_HEIGHT,
    width: DEVICE_WIDTH,
  },
  webViewStyleExpanded: {
    height: WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT,
    maxHeight: WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT,
    minHeight: WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT,
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
