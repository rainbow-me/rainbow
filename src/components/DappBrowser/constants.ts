import { ImageOptions } from '@candlefinance/faster-image';

export const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
export const HTTP = 'http://';
export const HTTPS = 'https://';

const BLANK_BASE64_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const FASTER_IMAGE_CONFIG: Partial<ImageOptions> = {
  // This placeholder avoids an occasional loading spinner flash
  base64Placeholder: BLANK_BASE64_PIXEL,
  cachePolicy: 'discNoCacheControl',
  resizeMode: 'cover',
  showActivityIndicator: false,
  transitionDuration: 0,
};
