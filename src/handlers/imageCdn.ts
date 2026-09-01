import { IMGIX_DOMAIN } from 'react-native-dotenv';

export const RAINBOW_IMAGE_CDN_HOST = 'img.p.rainbow.me';

export const isImageCdnUrl = (url: URL): boolean => url.hostname === IMGIX_DOMAIN || url.hostname === RAINBOW_IMAGE_CDN_HOST;
