/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, globalColors, useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { transformOrigin } from 'react-native-redash';
import { MMKV } from 'react-native-mmkv';
import { useBrowserContext } from './BrowserContext';
import { Image, StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { Freeze } from 'react-freeze';
import { COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, TAB_VIEW_COLUMN_WIDTH, TAB_VIEW_ROW_HEIGHT, WEBVIEW_HEIGHT } from './Dimensions';
import RNFS from 'react-native-fs';
import { WebViewEvent } from 'react-native-webview/lib/WebViewTypes';

interface BrowserTabProps {
  tabIndex: number;
  injectedJS: string;
}

type ScreenshotType = {
  id: string;
  isRendered?: boolean;
  uri: string;
};

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

const screenshotStorage = new MMKV();

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

const getWebsiteBackgroundColor = `
  const bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: "bg", payload: bgColor}));
  true;
  `;

export const BrowserTab = React.memo(function BrowserTab({ tabIndex, injectedJS }: BrowserTabProps) {
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

  const messengers = useRef<any[]>([]);

  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot | null>(null);

  const isActiveTab = useMemo(() => activeTabIndex === tabIndex, [activeTabIndex, tabIndex]);

  const tabId = useMemo(() => `${tabIndex}-${tabStates[tabIndex].url}`, [tabIndex, tabStates]);

  console.log('[BROWSER]: Render BrowserTab', { tabId, isActiveTab, url: webViewRefs.current[tabIndex]?.state });

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
        setActiveTabIndex(tabIndex);
      }
    }
  };

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (navState.url !== tabStates[tabIndex].url && navState.navigationType !== 'other') {
        updateActiveTabState(tabIndex, {
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
          url: navState.url,
        });
      } else {
        updateActiveTabState(tabIndex, {
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
          url: tabStates[tabIndex].url,
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

  const createMessengers = useCallback(
    (origin: string, tabId: string) => {
      const newMessenger = {
        onMessage: (data: any) => {
          console.log('[BROWSER]: APP RECEIVED MESSAGE', tabStates[tabIndex].url, data);
        },
        sendMessage: (data: any) => {
          console.log('[BROWSER]: sending msg to webview', tabStates[tabIndex].url, data);
          webViewRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
        },
        url: origin,
        tabId,
      };

      messengers.current.push(newMessenger);
    },
    [tabIndex, tabStates]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (!isActiveTab) return;
      const data = event.nativeEvent.data as any;
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
        } else if (parsedData.type === 'bg') {
          console.log('[BROWSER]: received bg color', parsedData.payload);
          setBackgroundColor(parsedData.payload);
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    },
    [isActiveTab]
  );

  const handleOnLoadStart = useCallback(
    (event: { nativeEvent: { url: string | URL } }) => {
      const { origin } = new URL(event.nativeEvent.url);
      messengers.current = [];
      createMessengers(origin, getTabId(tabIndex, tabStates[tabIndex].url));
    },
    [createMessengers, tabIndex, tabStates]
  );

  const handleOnLoad = useCallback(
    (event: WebViewEvent) => {
      // console.log('[BROWSER]: handleOnLoad', { event, tabIndex, url: tabStates[tabIndex].url });
      if (event.nativeEvent.loading) return;
      const m = messengers.current.find(m => {
        return m.url === new URL(tabStates[tabIndex].url).origin && m.tabId === getTabId(tabIndex, tabStates[tabIndex].url);
      });
      if (m) {
        m?.sendMessage({ type: 'message', payload: 'ping' });
      }
    },
    [tabIndex, tabStates]
  );

  const handleOnLoadEnd = useCallback(() => {
    console.log('[BROWSER]: handleOnLoadEnd', tabStates[tabIndex].url);
  }, [tabIndex, tabStates]);

  const handleOnError = useCallback(() => {
    console.log('[BROWSER]: handleOnError', tabStates[tabIndex].url);
  }, [tabIndex, tabStates]);

  const handleShouldStartLoadWithRequest = useCallback(() => {
    return true;
  }, []);

  const loadProgress = useSharedValue(0);

  const progressBarStyle = useAnimatedStyle(
    () => ({
      opacity: loadProgress.value === 1 ? withTiming(0, timingConfig) : withTiming(1, timingConfig),
      width: loadProgress.value * deviceWidth,
    }),
    []
  );

  const handleOnLoadProgress = useCallback(
    ({ nativeEvent: { progress } }: { nativeEvent: { progress: number } }) => {
      if (loadProgress) {
        if (loadProgress.value === 1) loadProgress.value = 0;
        loadProgress.value = withTiming(progress, timingConfig);
      }
    },
    [loadProgress]
  );

  return (
    <>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View style={[styles.webViewContainer, webViewStyle]}>
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
                freeze={!isActiveTab}
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
                  applicationNameForUserAgent={'Rainbow'}
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
                pointerEvents="none"
                style={[
                  styles.webViewStyle,
                  {
                    height: COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
                    left: 0,
                    position: 'absolute',
                    top: 0,
                    zIndex: 20000,
                  },
                ]}
                transition={{
                  duration: 300,
                  easing: Easing.bezier(0.2, 0, 0, 1),
                  type: 'timing',
                }}
              >
                <Image
                  height={WEBVIEW_HEIGHT}
                  onError={e => console.log('Image loading error:', e.nativeEvent.error)}
                  source={{ uri: screenshot?.uri }}
                  style={[
                    styles.webViewStyle,
                    {
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
      {isActiveTab && <Box as={Animated.View} background="blue" style={[styles.progressBar, progressBarStyle]} />}
    </>
  );
});

const styles = StyleSheet.create({
  webViewContainer: {
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'absolute',
    top: safeAreaInsetValues.top,
    width: deviceUtils.dimensions.width,
  },
  webViewStyle: {
    borderCurve: 'continuous',
    height: WEBVIEW_HEIGHT,
    maxHeight: WEBVIEW_HEIGHT,
    minHeight: WEBVIEW_HEIGHT,
    width: deviceUtils.dimensions.width,
  },
  progressBar: {
    height: 2,
    top: WEBVIEW_HEIGHT - 81,
    left: 0,
    width: deviceUtils.dimensions.width,
    position: 'absolute',
    zIndex: 11000,
  },
});
