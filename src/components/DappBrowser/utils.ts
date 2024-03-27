import { Share } from 'react-native';
import { RainbowError, logger } from '@/logger';
import { HTTP, HTTPS } from './constants';

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

export const generateUniqueId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return `${timestamp}${randomString}`;
};

export async function handleShareUrl(url: string): Promise<void> {
  try {
    await Share.share({ message: url });
  } catch (e: any) {
    logger.error(new RainbowError('Error sharing browser URL'), {
      message: e.message,
    });
  }
}
