import React, { memo, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { Freeze } from 'react-freeze';
import Animated, { FadeIn, useAnimatedProps, type AnimatedStyle, type DerivedValue, type SharedValue } from 'react-native-reanimated';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { type WebViewProps } from 'react-native-webview';
import type WebView from 'react-native-webview';

import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { globalColors, useColorMode } from '@/design-system';
import { IS_DEV } from '@/env';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

import {
  RAINBOW_HOME,
  TAB_SCREENSHOT_FASTER_IMAGE_CONFIG,
  TAB_SCREENSHOT_FILE_FORMAT,
  USER_AGENT,
  USER_AGENT_APPLICATION_NAME,
} from '../constants/constants';
import { EXTRA_WEBVIEW_HEIGHT, TOP_INSET, WEBVIEW_HEIGHT } from '../constants/Dimensions';
import { useBrowserContext } from '../context/BrowserContext';
import { useAnimatedTab } from '../hooks/useAnimatedTab';
import { useTabScreenshotProvider } from '../hooks/useTabScreenshotProvider';
import { useWebViewHandlers } from '../hooks/useWebViewHandlers';
import { type BrowserHistoryStore } from '../stores/browserHistoryStore';
import { useBrowserStore, type BrowserState } from '../stores/browserStore';
import { type BrowserTabProps, type ScreenshotType } from '../types';
import { freezeWebsite, SCRIPTS_TO_INJECT, unfreezeWebsite } from '../utils/scripts';
import { CloseTabButton } from './CloseTabButton';
import { WebViewShadows } from './DappBrowserShadows';
import { DappBrowserWebview } from './DappBrowserWebview';
import { ErrorPage } from './ErrorPage';
import { Homepage } from './Homepage';
import { WebViewBorder } from './WebViewBorder';

export const BrowserTab = memo(function BrowserTab({ addRecent, setLogo, setTitle, tabId }: BrowserTabProps) {
  const viewShotRef = useRef<ViewShotRef | null>(null);

  const { animatedWebViewBackgroundColorStyle, animatedWebViewStyle, backgroundColor, zIndexAnimatedStyle } = useAnimatedTab({ tabId });

  return (
    <WebViewShadows tabId={tabId} zIndexAnimatedStyle={zIndexAnimatedStyle}>
      <Animated.View style={[styles.webViewContainer, animatedWebViewStyle, Platform.OS === 'ios' ? {} : zIndexAnimatedStyle]}>
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
        {Platform.OS === 'ios' && <WebViewBorder tabId={tabId} />}
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
  setLogo: BrowserState['setLogo'];
  setTitle: BrowserState['setTitle'];
  tabId: string;
  viewShotRef: MutableRefObject<ViewShotRef | null>;
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
  animatedStyle: AnimatedStyle<ViewStyle>;
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
  setLogo: BrowserState['setLogo'];
  setTitle: BrowserState['setTitle'];
  tabId: string;
  viewShotRef: MutableRefObject<ViewShotRef | null>;
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
  }, [activeTabRef, isActiveTab, isOnHomepage, renderKey, resetScrollHandlers, screenshotCaptureRef, webViewRef]);

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
  }, [isActiveTab, renderKey, screenshotCaptureRef, viewShotRef, webViewRef]);

  return (
    <Freeze freeze={!isActiveTab}>
      <TabWebView
        key={renderKey}
        onContentProcessDidTerminate={handleOnContentProcessDidTerminate}
        onLoadProgress={handleOnLoadProgress}
        onMessage={handleOnMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onRenderProcessGone={handleOnContentProcessDidTerminate}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        ref={webViewRef}
        source={tabUrl}
        onOpenWindow={handleOnOpenWindow}
      />
    </Freeze>
  );
};

const FreezableWebView = memo(FreezableWebViewComponent);

const TabWebViewComponent = (
  props: Required<
    Pick<
      WebViewProps,
      | 'onContentProcessDidTerminate'
      | 'onLoadProgress'
      | 'onMessage'
      | 'onNavigationStateChange'
      | 'onRenderProcessGone'
      | 'onShouldStartLoadWithRequest'
      | 'onOpenWindow'
    >
  > & { source: string },
  ref: React.Ref<WebView>
) => {
  const { onScrollWebView, onTouchEnd, onTouchMove, onTouchStart } = useBrowserContext();

  return (
    <DappBrowserWebview
      allowsBackForwardNavigationGestures
      allowsInlineMediaPlayback
      applicationNameForUserAgent={USER_AGENT_APPLICATION_NAME}
      automaticallyAdjustContentInsets
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentInset={{ bottom: 0, left: 0, right: 0, top: 0 }}
      decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined}
      fraudulentWebsiteWarningEnabled
      injectedJavaScript={SCRIPTS_TO_INJECT}
      mediaPlaybackRequiresUserAction
      onContentProcessDidTerminate={props.onContentProcessDidTerminate}
      onLoadProgress={props.onLoadProgress}
      onMessage={props.onMessage}
      onNavigationStateChange={props.onNavigationStateChange}
      onRenderProcessGone={props.onRenderProcessGone}
      onScroll={Platform.OS === 'ios' ? onScrollWebView : undefined}
      onShouldStartLoadWithRequest={props.onShouldStartLoadWithRequest}
      onOpenWindow={props.onOpenWindow}
      onTouchEnd={Platform.OS === 'ios' ? onTouchEnd : undefined}
      onTouchMove={Platform.OS === 'ios' ? onTouchMove : undefined}
      onTouchStart={Platform.OS === 'ios' ? onTouchStart : undefined}
      originWhitelist={['*']}
      ref={ref}
      renderError={() => <ErrorPage />}
      renderLoading={() => <></>}
      source={{ uri: props.source }}
      style={styles.webView}
      userAgent={USER_AGENT[Platform.OS === 'ios' ? 'IOS' : 'ANDROID']}
      webviewDebuggingEnabled={IS_DEV}
    />
  );
};

const TabWebView = memo(React.forwardRef(TabWebViewComponent));

const styles = StyleSheet.create({
  screenshotContainer: {
    height: Platform.OS === 'ios' ? WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT : WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: DEVICE_WIDTH,
    zIndex: 20000,
  },
  viewShotContainer: {
    height: Platform.OS === 'ios' ? WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT : WEBVIEW_HEIGHT,
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
