import { ImageOptions } from '@candlefinance/faster-image';
import { CaptureOptions } from 'react-native-view-shot';

export const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
export const HTTP = 'http://';
export const HTTPS = 'https://';
export const RAINBOW_HOME = 'RAINBOW_HOME';

export const DEFAULT_TAB_URL = RAINBOW_HOME;

export const USER_AGENT = {
  IOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  ANDROID: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/53',
};
export const USER_AGENT_APPLICATION_NAME = 'Rainbow';

const BLANK_BASE64_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const TAB_SCREENSHOT_FASTER_IMAGE_CONFIG: Partial<ImageOptions> = {
  // This placeholder avoids an occasional loading spinner flash
  base64Placeholder: BLANK_BASE64_PIXEL,
  cachePolicy: 'discNoCacheControl',
  resizeMode: 'cover',
  showActivityIndicator: false,
  transitionDuration: 0,
};

export const TAB_SCREENSHOT_FILE_FORMAT: CaptureOptions = { format: 'jpg' };
