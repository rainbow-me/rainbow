import React, { MutableRefObject, useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import { runOnUI, SharedValue, withTiming } from 'react-native-reanimated';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { ShouldStartLoadRequest, WebViewEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { appMessenger, Messenger } from '@/browserMessaging/AppMessenger';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_IOS } from '@/env';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { BrowserHistoryStore } from '@/state/browserHistory';
import { BrowserStore, useBrowserStore } from '@/state/browser/browserStore';
import { getDappHostname } from '@/utils/connectedApps';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { handleProviderRequestApp } from '../handleProviderRequest';
import { TabId } from '../types';
import { generateUniqueIdWorklet, isValidAppStoreUrl } from '../utils';

interface UseWebViewHandlersParams {
  addRecent: BrowserHistoryStore['addRecent'];
  backgroundColor: SharedValue<string>;
  setLogo: BrowserStore['setLogo'];
  setRenderKey: React.Dispatch<React.SetStateAction<string>>;
  setTitle: BrowserStore['setTitle'];
  tabId: TabId;
  titleRef: MutableRefObject<string | null>;
  webViewRef: MutableRefObject<WebView | null>;
}

type MessengerWithUrl = Messenger & { url?: string };

export function useWebViewHandlers({
  addRecent,
  backgroundColor,
  setLogo,
  setRenderKey,
  setTitle,
  tabId,
  titleRef,
  webViewRef,
}: UseWebViewHandlersParams) {
  const { activeTabRef, loadProgress, resetScrollHandlers } = useBrowserContext();
  const { updateTabUrlWorklet } = useBrowserWorkletsContext();
  const { setParams } = useNavigation();

  const currentMessengerRef = useRef<MessengerWithUrl | null>(null);
  const logoRef = useRef<string | null>(null);

  const handleOnMessage = useCallback(
    (event: Partial<WebViewMessageEvent>) => {
      if (!useBrowserStore.getState().isTabActive(tabId)) return;

      const data = event.nativeEvent?.data as unknown;

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

          const url = useBrowserStore.getState().getTabUrl(tabId);
          if (url) {
            addRecent({
              url,
              name: pageTitle,
              image: logoUrl,
              timestamp: Date.now(),
            });
          }
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
                title: titleRef.current || useBrowserStore.getState().getTabUrl(tabId),
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
    [addRecent, backgroundColor, setLogo, setTitle, tabId, titleRef]
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
      if (
        navState.navigationType !== 'other' ||
        getDappHostname(navState.url) === getDappHostname(useBrowserStore.getState().getTabUrl(tabId) || '')
      ) {
        runOnUI(updateTabUrlWorklet)({ tabId, url: navState.url });
      }
      useBrowserStore.getState().setNavState({ canGoBack: navState.canGoBack, canGoForward: navState.canGoForward }, tabId);
      resetScrollHandlers();
    },
    [resetScrollHandlers, tabId, updateTabUrlWorklet]
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
    const currentUrl = useBrowserStore.getState().getTabUrl(tabId);
    if (currentUrl) useBrowserStore.getState().goToPage(currentUrl, tabId);

    setRenderKey(`${tabId}-${generateUniqueIdWorklet()}`);
  }, [setRenderKey, tabId]);

  return {
    handleNavigationStateChange,
    handleOnContentProcessDidTerminate,
    handleOnLoad,
    handleOnLoadProgress,
    handleOnMessage,
    handleOnOpenWindow,
    handleShouldStartLoadWithRequest,
  };
}
