/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Freeze } from 'react-freeze';
import { Linking, StyleSheet } from 'react-native';
import Animated, { AnimatedStyle, DerivedValue, FadeIn, SharedValue, runOnUI, useAnimatedProps, withTiming } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView, { WebViewMessageEvent, WebViewNavigation, WebViewProps } from 'react-native-webview';
import { ShouldStartLoadRequest, WebViewEvent } from 'react-native-webview/lib/WebViewTypes';
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
import { EXTRA_WEBVIEW_HEIGHT, TOP_INSET, WEBVIEW_HEIGHT } from './Dimensions';
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
import { freezeWebsite, getWebsiteMetadata, hideBanners, unfreezeWebsite } from './scripts';
import { BrowserTabProps, ScreenshotType } from './types';
import { isValidAppStoreUrl } from './utils';

export const BrowserTab = memo(function BrowserTab({ addRecent, setLogo, setTitle, tabId }: BrowserTabProps) {
  const viewShotRef = useRef<ViewShot | null>(null);

  const {
    animatedWebViewBackgroundColorStyle,
    animatedWebViewStyle,
    backgroundColor,
    expensiveAnimatedWebViewStyles,
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
          <WebViewBorder enabled={IS_IOS} tabId={tabId} />
        </Animated.View>
        <CloseTabButton tabId={tabId} />
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
    (request: ShouldStartLoadRequest) => {
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

      if (isValidAppStoreUrl(targetUrl)) {
        Linking.openURL(targetUrl);
        return;
      }

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
      injectedJavaScript={getWebsiteMetadata + hideBanners}
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

const styles = StyleSheet.create({
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
    flex: 0,
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
});
