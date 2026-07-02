export const HTTP_PREFIX = 'http://';
export const HTTPS_PREFIX = 'https://';

// URL validation regex breakdown here: https://mathiasbynens.be/demo/url-regex
// This is the @diegoperini version; validation logic: https://gist.github.com/dperini/729294
const URL_PATTERN_REGEX =
  /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export function isMissingValidProtocolWorklet(url: string): boolean {
  'worklet';
  return !url.startsWith(HTTP_PREFIX) && !url.startsWith(HTTPS_PREFIX);
}

export function isValidWebUrlWorklet(url: string): boolean {
  'worklet';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return false;
  }

  let urlForValidation = url.trim();
  if (isMissingValidProtocolWorklet(urlForValidation)) {
    urlForValidation = HTTPS_PREFIX + urlForValidation;
  }
  return URL_PATTERN_REGEX.test(urlForValidation);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
