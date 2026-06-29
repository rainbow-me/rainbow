import { Share } from 'react-native';

import { type WebViewNavigationEvent } from 'react-native-webview/lib/RNCWebViewNativeComponent';

import { HTTPS_PREFIX, isMissingValidProtocolWorklet } from '@/framework/core/utils/url';
import { ensureError, logger, RainbowError } from '@/logger';

import { APP_STORE_URL_PREFIXES, RAINBOW_HOME } from './constants';

export function isValidAppStoreUrl(url: string): boolean {
  return APP_STORE_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

export const normalizeUrlWorklet = (url: string): string => {
  'worklet';
  if (!url) {
    return '';
  }

  if (url === RAINBOW_HOME || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  let normalizedUrl = url;
  if (isMissingValidProtocolWorklet(normalizedUrl)) {
    normalizedUrl = HTTPS_PREFIX + normalizedUrl;
  }
  if (!normalizedUrl.endsWith('/') && !normalizedUrl.includes('?')) {
    normalizedUrl += '/';
  }
  return normalizedUrl;
};

export const formatUrl = (url: string, formatSearches = true, prettifyUrl = true, trimTrailingSlash = false): string => {
  if (!url || url === RAINBOW_HOME) return '';

  let formattedValue = url;
  let isGoogleSearch = false;
  try {
    const { hostname, pathname, search } = new URL(url);
    isGoogleSearch = hostname === 'www.google.com' && pathname === '/search';

    if (isGoogleSearch && formatSearches) {
      const params = new URLSearchParams(search);
      formattedValue = params.get('q') || '';
    } else if (prettifyUrl) {
      formattedValue = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    }
    if (trimTrailingSlash) {
      formattedValue = formattedValue.endsWith('/') ? formattedValue.slice(0, -1) : formattedValue;
    }
  } catch {
    if (!isGoogleSearch || !formatSearches) {
      if (trimTrailingSlash) {
        formattedValue = url.endsWith('/') ? url.slice(0, -1) : url;
      } else {
        formattedValue = url;
      }
    }
  }
  return formattedValue;
};

export const getNameFromFormattedUrl = (formattedUrl: string, needsFormatting?: boolean): string => {
  const url = needsFormatting ? formatUrl(formattedUrl, false, true, true) : formattedUrl;
  const parts = url.split('.');
  let name;
  if (parts.length > 2 && parts[parts.length - 2].length <= 2) {
    name = parts[parts.length - 3];
  } else if (parts.length >= 2) {
    name = parts[parts.length - 2];
  } else {
    return formattedUrl;
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export async function handleShareUrl(url: string): Promise<void> {
  try {
    await Share.share({ message: url });
  } catch (e) {
    logger.error(new RainbowError('[DappBrowser]: Error sharing browser URL'), {
      error: ensureError(e),
      url,
    });
  }
}

export function normalizeUrlForRecents(url: string): string {
  if (url.includes('?')) {
    return url;
  } else {
    if (url.endsWith('/')) {
      return url;
    } else {
      return url + '/';
    }
  }
}

// ---------------------------------------------------------------------------- //
// 🔍 Navigation state logger
//
// Useful for observing WebView navigation events
// Add to handleNavigationStateChange in BrowserTab to use
// ---------------------------------------------------------------------------- //
export const navigationStateLogger = (navState: WebViewNavigationEvent, tabIndex: number, tabUrl: string | undefined) => {
  const emoji = navStateEmojiMap[navState.navigationType];
  const eventName = navStateEventNameMap[navState.navigationType];
  const isLoading = navState.loading ? '🔄 YES' : '🙅‍♂️ NO';
  const didUrlChange = navState.url !== tabUrl ? '🚨 YES' : '🙅‍♂️ NO';

  return console.log(`
      ────────────────────────────
      ${emoji}  NAVIGATION EVENT = ${eventName}

      🌐  navState URL: ${navState.url}
      📂  tabState URL: ${tabUrl}

      -  URL changed?  ${didUrlChange}
      -  loading?  ${isLoading}
      -  canGoBack?  ${navState.canGoBack ? '✅ YES' : '🙅‍♂️ NO'}
      ────────────────────────────
`);
};

const navStateEmojiMap = {
  click: '👆',
  formsubmit: '☑️',
  backforward: '⬅️ ➡️',
  reload: '🔄',
  formresubmit: '☑️☑️',
  other: '🤷',
  undefined: '🤷🤷',
};

const navStateEventNameMap = {
  click: 'CLICK',
  formsubmit: 'FORM SUBMIT',
  backforward: 'BACK FORWARD',
  reload: 'RELOAD',
  formresubmit: 'FORM RESUBMIT',
  other: 'OTHER',
  undefined: 'UNDEFINED',
};
