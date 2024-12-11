import { ImageOptions } from '@candlefinance/faster-image';
import { CaptureOptions } from 'react-native-view-shot';
import { globalColors } from '@/design-system';
import { IS_IOS } from '@/env';

export const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
export const HTTP = 'http://';
export const HTTPS = 'https://';
export const RAINBOW_HOME = 'RAINBOW_HOME';

export const IOS_APP_STORE_URL_PREFIXES = ['itms-apps://', 'itms-appss://', 'https://itunes.apple.com', 'https://apps.apple.com'];
export const ANDROID_APP_STORE_URL_PREFIXES = ['market://', 'https://play.google.com/store'];

export const APP_STORE_URL_PREFIXES = [...IOS_APP_STORE_URL_PREFIXES, ...ANDROID_APP_STORE_URL_PREFIXES];

export const USER_AGENT = {
  IOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  ANDROID: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.103 Mobile Safari/537.36',
};
export const USER_AGENT_APPLICATION_NAME = 'Rainbow';

export const BLANK_BASE64_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const TAB_SCREENSHOT_FASTER_IMAGE_CONFIG: Partial<ImageOptions> = {
  // This placeholder avoids an occasional loading spinner flash
  base64Placeholder: BLANK_BASE64_PIXEL,
  cachePolicy: 'memory',
  resizeMode: IS_IOS ? 'topContain' : 'cover',
  showActivityIndicator: false,
  transitionDuration: 0,
};

export const TAB_SCREENSHOT_FILE_FORMAT: CaptureOptions = { format: 'jpg' };

export const TAB_VIEW_BACKGROUND_COLOR_DARK = '#0A0A0A';
export const TAB_VIEW_BACKGROUND_COLOR_LIGHT = '#F2F2F5';

export const HOMEPAGE_BACKGROUND_COLOR_DARK = globalColors.grey100;
export const HOMEPAGE_BACKGROUND_COLOR_LIGHT = '#F7F7F9';

export const BROWSER_BACKGROUND_COLOR_DARK = HOMEPAGE_BACKGROUND_COLOR_DARK;
export const BROWSER_BACKGROUND_COLOR_LIGHT = IS_IOS ? HOMEPAGE_BACKGROUND_COLOR_LIGHT : TAB_VIEW_BACKGROUND_COLOR_LIGHT;
