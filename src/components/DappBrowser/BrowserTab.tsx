/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { memo, MutableRefObject, useEffect, useRef, useState } from 'react';
import { Freeze } from 'react-freeze';
import { StyleSheet } from 'react-native';
import Animated, { AnimatedStyle, DerivedValue, FadeIn, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView, { WebViewProps } from 'react-native-webview';
import { globalColors, useColorMode } from '@/design-system';
import { IS_DEV, IS_IOS } from '@/env';
import { BrowserStore, useBrowserStore } from '@/state/browser/browserStore';
import { BrowserHistoryStore } from '@/state/browserHistory';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { AnimatedFasterImage } from '../AnimatedComponents/AnimatedFasterImage';
import { useBrowserContext } from './BrowserContext';
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
import { useAnimatedTab } from './hooks/useAnimatedTab';
import { useTabScreenshotProvider } from './hooks/useTabScreenshotProvider';
import { useWebViewHandlers } from './hooks/useWebViewHandlers';
import { SCRIPTS_TO_INJECT, freezeWebsite, unfreezeWebsite } from './scripts';
import { BrowserTabProps, ScreenshotType } from './types';

export const BrowserTab = memo(function BrowserTab({ addRecent, setLogo, setTitle, tabId }: BrowserTabProps) {
  const viewShotRef = useRef<ViewShot | null>(null);

  const { animatedWebViewBackgroundColorStyle, animatedWebViewStyle, backgroundColor, zIndexAnimatedStyle } = useAnimatedTab({ tabId });

  return (
    <WebViewShadows tabId={tabId} zIndexAnimatedStyle={zIndexAnimatedStyle}>
      <Animated.View style={[styles.webViewContainer, animatedWebViewStyle, IS_IOS ? {} : zIndexAnimatedStyle]}>
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
        {IS_IOS && <WebViewBorder tabId={tabId} />}
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
  addRecent: BrowserHistoryStore['addRecent'];
  backgroundColor: SharedValue<string>;
  setLogo: BrowserStore['setLogo'];
  setTitle: BrowserStore['setTitle'];
  tabId: string;
  viewShotRef: MutableRefObject<ViewShot | null>;
}) => {
  const isOnHomepage = useBrowserStore(state => !state.getTabData?.(tabId)?.url || state.getTabData?.(tabId)?.url === RAINBOW_HOME);
  const { isDarkMode } = useColorMode();

  useEffect(() => {
    if (isOnHomepage) {
      // Reset background color when returning to the homepage
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
 * #### `TabScreenshotContainer`
 *
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
    <AnimatedFasterImage animatedProps={animatedProps} style={[styles.screenshotContainer, animatedStyle]} />
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
  addRecent: BrowserHistoryStore['addRecent'];
  backgroundColor: SharedValue<string>;
  setLogo: BrowserStore['setLogo'];
  setTitle: BrowserStore['setTitle'];
  tabId: string;
  viewShotRef: MutableRefObject<ViewShot | null>;
}) => {
  const { activeTabRef, resetScrollHandlers, screenshotCaptureRef } = useBrowserContext();

  const webViewRef = useRef<WebView>(null);
  const titleRef = useRef<string | null>(null);

  const [renderKey, setRenderKey] = useState(`${tabId}-0`);
  const isActiveTab = useBrowserStore(state => state.isTabActive(tabId));
  const tabUrl = useBrowserStore(state => state.getTabData?.(tabId)?.url) || RAINBOW_HOME;
  const isOnHomepage = tabUrl === RAINBOW_HOME;

  const {
    handleNavigationStateChange,
    handleOnContentProcessDidTerminate,
    handleOnLoad,
    handleOnLoadProgress,
    handleOnMessage,
    handleOnOpenWindow,
    handleShouldStartLoadWithRequest,
  } = useWebViewHandlers({
    addRecent,
    backgroundColor,
    setLogo,
    setRenderKey,
    setTitle,
    tabId,
    titleRef,
    webViewRef,
  });

  useEffect(() => {
    if (isActiveTab) {
      resetScrollHandlers();

      if (webViewRef.current) {
        activeTabRef.current = webViewRef.current;
        if (titleRef.current) activeTabRef.current.title = titleRef.current;
      }
    }
  }, [activeTabRef, isActiveTab, isOnHomepage, resetScrollHandlers, screenshotCaptureRef, webViewRef]);

  useEffect(() => {
    if (isActiveTab) screenshotCaptureRef.current = viewShotRef.current;

    if (webViewRef.current) {
      if (isActiveTab) {
        // Unfreeze heavy site processes when the tab becomes active
        webViewRef.current.injectJavaScript(unfreezeWebsite);
        webViewRef.current.setActive(true);
      } else {
        // Freeze when becoming inactive
        webViewRef.current.injectJavaScript(freezeWebsite);
        webViewRef.current.setActive(false);
      }
    }
  }, [isActiveTab, screenshotCaptureRef, viewShotRef, webViewRef]);

  return (
    <Freeze freeze={!isActiveTab}>
      <TabWebView
        key={renderKey}
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
      injectedJavaScript={SCRIPTS_TO_INJECT}
      mediaPlaybackRequiresUserAction
      onScroll={IS_IOS ? onScrollWebView : undefined}
      onTouchEnd={IS_IOS ? onTouchEnd : undefined}
      onTouchMove={IS_IOS ? onTouchMove : undefined}
      onTouchStart={IS_IOS ? onTouchStart : undefined}
      originWhitelist={['*']}
      ref={ref}
      renderError={() => <ErrorPage />}
      renderLoading={() => <></>}
      style={styles.webView}
      userAgent={USER_AGENT[IS_IOS ? 'IOS' : 'ANDROID']}
      webviewDebuggingEnabled={IS_DEV}
    />
  );
};

const TabWebView = memo(React.forwardRef(TabWebViewComponent));

const styles = StyleSheet.create({
  screenshotContainer: {
    height: IS_IOS ? WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT : WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: DEVICE_WIDTH,
    zIndex: 20000,
  },
  viewShotContainer: {
    height: IS_IOS ? WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT : WEBVIEW_HEIGHT,
    width: DEVICE_WIDTH,
  },
  webViewContainer: {
    borderCurve: 'continuous',
    overflow: 'hidden',
    position: 'absolute',
    top: TOP_INSET,
    width: DEVICE_WIDTH,
  },
  webView: {
    backgroundColor: 'transparent',
    flex: 0,
    height: '100%',
    width: DEVICE_WIDTH,
  },
});
