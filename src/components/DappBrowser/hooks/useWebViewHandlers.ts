import { useCallback, useRef, type MutableRefObject } from 'react';
import type React from 'react';
import { Platform } from 'react-native';

import { runOnUI, withTiming, type SharedValue } from 'react-native-reanimated';
import { type WebViewMessageEvent } from 'react-native-webview';
import type WebView from 'react-native-webview';
import { type ShouldStartLoadRequest, type WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';

import { appMessenger, type Messenger } from '@/browserMessaging/AppMessenger';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { getDappHostname } from '@/features/dapp/utils/dappUrls';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useBrowserStore, type BrowserState } from '@/state/browser/browserStore';
import { type BrowserHistoryStore } from '@/state/browserHistory';
import { openInBrowser } from '@/utils/openInBrowser';
import { generateUniqueId } from '@/worklets/strings';

import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { addReferralToDappBrowserUrl } from '../dappReferrals';
import { handleProviderRequestApp } from '../handleProviderRequest';
import { type TabId } from '../types';
import { isValidAppStoreUrl } from '../utils';

interface UseWebViewHandlersParams {
  addRecent: BrowserHistoryStore['addRecent'];
  backgroundColor: SharedValue<string>;
  setLogo: BrowserState['setLogo'];
  setRenderKey: React.Dispatch<React.SetStateAction<string>>;
  setTitle: BrowserState['setTitle'];
  tabId: TabId;
  titleRef: MutableRefObject<string | null>;
  webViewRef: MutableRefObject<WebView | null>;
}

type MessengerWithUrl = Messenger & { url: string; tabId: string };

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

  const currentMessengerRef = useRef<MessengerWithUrl | null>(null);
  const dappReferralsAppliedRef = useRef(new Set<string>());
  const logoRef = useRef<string | null>(null);

  const getCurrentMessenger = useCallback(
    (tabId: string, url: string) => {
      if (!currentMessengerRef.current || currentMessengerRef.current.tabId !== tabId || currentMessengerRef.current.url !== url) {
        currentMessengerRef.current = appMessenger(webViewRef, tabId, url);
      }
      return currentMessengerRef.current;
    },
    [webViewRef]
  );

  const handleOnMessage = useCallback(
    (event: Partial<WebViewMessageEvent>) => {
      if (!useBrowserStore.getState().isTabActive(tabId)) return;

      const data = event.nativeEvent?.data as unknown;

      try {
        // validate message and parse data
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (!parsedData || (!parsedData.topic && !parsedData.payload)) return;

        if (Platform.OS === 'ios' && parsedData.topic === 'injectedUnderPageBackgroundColor') {
          const { underPageBackgroundColor } = parsedData.payload;

          if (underPageBackgroundColor && typeof underPageBackgroundColor === 'string') {
            backgroundColor.value = underPageBackgroundColor;
          }
        } else if (parsedData.topic === 'websiteMetadata') {
          const { bgColor, logoUrl, pageTitle } = parsedData.payload;

          if (Platform.OS !== 'ios' && bgColor && typeof bgColor === 'string') {
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
          if (!event.nativeEvent?.url) return;
          const { origin } = new URL(event.nativeEvent.url);
          const m = getCurrentMessenger(tabId, origin);

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
    [addRecent, backgroundColor, setLogo, setTitle, tabId, titleRef, getCurrentMessenger]
  );

  const applyDappReferral = useCallback(
    (url: string) => {
      const dappHostname = getDappHostname(url);
      if (!dappHostname || dappReferralsAppliedRef.current.has(dappHostname)) {
        return false;
      }

      const referralUrl = addReferralToDappBrowserUrl(url);
      if (referralUrl === url) {
        return false;
      }

      dappReferralsAppliedRef.current.add(dappHostname);
      useBrowserStore.getState().goToPage(referralUrl, tabId);
      runOnUI(updateTabUrlWorklet)({ tabId, url: referralUrl });
      return true;
    },
    [tabId, updateTabUrlWorklet]
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest) => {
      if (request.url.startsWith('rainbow://wc') || request.url.startsWith('https://rnbwappdotcom.app.link/')) {
        Navigation.handleAction(Routes.NO_NEED_WC_SHEET);
        activeTabRef.current?.reload();
        return false;
      }

      if (request.isTopFrame && applyDappReferral(request.url)) {
        return false;
      }

      return true;
    },
    [activeTabRef, applyDappReferral]
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
        openInBrowser(targetUrl);
        return;
      }

      const currentUrl = useBrowserStore.getState().getTabUrl(tabId);
      if (currentUrl === targetUrl) return;

      Navigation.setParams<typeof Routes.DAPP_BROWSER_SCREEN>({ url: targetUrl });
    },
    [tabId]
  );

  const handleOnContentProcessDidTerminate = useCallback(() => {
    const currentUrl = useBrowserStore.getState().getTabUrl(tabId);
    if (currentUrl) useBrowserStore.getState().goToPage(currentUrl, tabId);

    setRenderKey(`${tabId}-${generateUniqueId()}`);
  }, [setRenderKey, tabId]);

  return {
    handleNavigationStateChange,
    handleOnContentProcessDidTerminate,
    handleOnLoadProgress,
    handleOnMessage,
    handleOnOpenWindow,
    handleShouldStartLoadWithRequest,
  };
}
