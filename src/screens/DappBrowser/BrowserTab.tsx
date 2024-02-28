/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, globalColors, useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, { Easing, interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { transformOrigin } from 'react-native-redash';
import { MMKV } from 'react-native-mmkv';
import { useBrowserContext } from './BrowserContext';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Image, StyleSheet, View } from 'react-native';
import { Freeze } from 'react-freeze';
import { COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, TAB_VIEW_COLUMN_WIDTH, TAB_VIEW_ROW_HEIGHT, WEBVIEW_HEIGHT } from './Dimensions';

interface BrowserTabProps {
  loadProgress: Animated.SharedValue<number>;
  tabIndex: number;
}

type ScreenshotType = {
  id: string;
  isRendered?: boolean;
  uri: string;
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
  window.ReactNativeWebView.postMessage({ type: "bg", payload: bgColor});
  true;
  `;

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

export const BrowserTab = React.memo(function BrowserTab({ loadProgress, tabIndex }: BrowserTabProps) {
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

  const isActiveTab = useMemo(() => activeTabIndex === tabIndex, [activeTabIndex, tabIndex]);

  const tabId = useMemo(() => `${tabIndex}-${tabStates[tabIndex].url}`, [tabIndex, tabStates]);
  const getInjectedJS = async () => {
    return RNFS.readFile(`${RNFS.MainBundlePath}/InjectedJSBundle.js`, 'utf8');
  };

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
        setBackgroundColor(parsedData.payload);
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }, []);

  const handleOnLoadStart = useCallback((event: { nativeEvent: { url: string | URL } }) => {
    const { origin } = new URL(event.nativeEvent.url);
    messengers.current = [];
    createMessengers(origin);
  }, []);

  const handleOnLoad = useCallback(() => {
    console.log('onLoad');
  }, []);

  const handleOnLoadEnd = useCallback(() => {
    console.log('onLoad');
  }, []);

  const handleOnError = useCallback(() => {
    console.log('onLoad');
  }, []);

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
                injectedJavaScriptBeforeContentLoaded={injectedJS || ''}
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

const styles = StyleSheet.create({
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
