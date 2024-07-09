import { Share } from 'react-native';
import { WebViewNavigationEvent } from 'react-native-webview/lib/RNCWebViewNativeComponent';
import { RainbowError, logger } from '@/logger';
import { HTTP, HTTPS, RAINBOW_HOME } from './constants';

// ---------------------------------------------------------------------------- //
// URL validation regex breakdown here: https://mathiasbynens.be/demo/url-regex
//
// This is the @diegoperini version, which is a bit long but accurate
// Details on its validation logic: https://gist.github.com/dperini/729294
// ---------------------------------------------------------------------------- //
const URL_PATTERN_REGEX =
  /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export function isValidURL(url: string): boolean {
  let urlForValidation = url.trim();
  if (!urlForValidation.startsWith(HTTP) && !urlForValidation.startsWith(HTTPS)) {
    urlForValidation = HTTPS + urlForValidation;
  }
  return URL_PATTERN_REGEX.test(urlForValidation);
}

export function isValidURLWorklet(url: string): boolean {
  'worklet';
  let urlForValidation = url.trim();
  if (!urlForValidation.startsWith(HTTP) && !urlForValidation.startsWith(HTTPS)) {
    urlForValidation = HTTPS + urlForValidation;
  }
  return URL_PATTERN_REGEX.test(urlForValidation);
}

export const normalizeUrl = (url: string): string => {
  if (!url) {
    return '';
  }
  let normalizedUrl = url;
  if (!normalizedUrl.startsWith(HTTP) && !normalizedUrl.startsWith(HTTPS)) {
    normalizedUrl = HTTPS + normalizedUrl;
  }
  if (!normalizedUrl.endsWith('/') && !normalizedUrl.includes('?')) {
    normalizedUrl += '/';
  }
  return normalizedUrl;
};

export const normalizeUrlWorklet = (url: string): string => {
  'worklet';
  if (!url) {
    return '';
  }
  let normalizedUrl = url;
  if (!normalizedUrl.startsWith(HTTP) && !normalizedUrl.startsWith(HTTPS)) {
    normalizedUrl = HTTPS + normalizedUrl;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    logger.error(new RainbowError('Error sharing browser URL'), {
      message: e.message,
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
