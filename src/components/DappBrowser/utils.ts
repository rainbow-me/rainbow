import { Share } from 'react-native';
import { WebViewNavigationEvent } from 'react-native-webview/lib/RNCWebViewNativeComponent';
import { RainbowError, logger } from '@/logger';
import { HTTP, HTTPS } from './constants';
import { TabState } from './BrowserContext';

// ---------------------------------------------------------------------------- //
// URL validation regex breakdown here: https://mathiasbynens.be/demo/url-regex
//
// This is the @diegoperini version, which is a bit long but accurate
// Details on its validation logic: https://gist.github.com/dperini/729294
// ---------------------------------------------------------------------------- //
const urlPattern =
  /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export function isValidURL(url: string): boolean {
  let urlForValidation = url.trim();
  if (!urlForValidation.startsWith(HTTP) && !urlForValidation.startsWith(HTTPS)) {
    urlForValidation = HTTPS + urlForValidation;
  }
  return urlPattern.test(urlForValidation);
}

export const normalizeUrl = (url: string): string => {
  if (!url) {
    return '';
  }
  if (!url.startsWith(HTTP) && !url.startsWith(HTTPS)) {
    return HTTPS + url;
  }
  return url;
};

export const formatUrl = (url: string): string => {
  let formattedValue = '';
  let isGoogleSearch = false;
  try {
    const { hostname, pathname, search } = new URL(url);
    isGoogleSearch = hostname === 'www.google.com' && pathname === '/search';
    if (isGoogleSearch) {
      const params = new URLSearchParams(search);
      formattedValue = params.get('q') || '';
    } else {
      formattedValue = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    }
  } catch {
    if (!isGoogleSearch) {
      formattedValue = url;
    }
  }
  return formattedValue;
};

export const generateUniqueId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return `${timestamp}${randomString}`;
};

export function generateUniqueIdWorklet(): string {
  'worklet';
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return `${timestamp}${randomString}`;
}

export const getNameFromFormattedUrl = (formattedUrl: string): string => {
  const parts = formattedUrl.split('.');
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
  } catch (e: any) {
    logger.error(new RainbowError('Error sharing browser URL'), {
      message: e.message,
      url,
    });
  }
}

// ---------------------------------------------------------------------------- //
// 🔍 Navigation state logger
//
// Useful for observing WebView navigation events
// Add to handleNavigationStateChange in BrowserTab to use
// ---------------------------------------------------------------------------- //
export const navigationStateLogger = (navState: WebViewNavigationEvent, tabIndex: number, tabStates: TabState[]) => {
  const emoji = navStateEmojiMap[navState.navigationType];
  const eventName = navStateEventNameMap[navState.navigationType];
  const isLoading = navState.loading ? '🔄 YES' : '🙅‍♂️ NO';
  const didUrlChange = navState.url !== tabStates[tabIndex].url ? '🚨 YES' : '🙅‍♂️ NO';

  return console.log(`
      ────────────────────────────
      ${emoji}  NAVIGATION EVENT = ${eventName}

      🌐  navState URL: ${navState.url}
      📂  tabState URL: ${tabStates[tabIndex].url}

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
