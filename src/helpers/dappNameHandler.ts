import URL from 'url-parse';
import { memoFn } from '../utils/memoFn';

export const getDappHostname = memoFn(url => {
  // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
  const urlObject = new URL(url);
  let hostname;
  const subdomains = urlObject.hostname.split('.');
  if (subdomains.length === 2) {
    hostname = urlObject.hostname;
  } else {
    hostname = `${subdomains[subdomains.length - 2]}.${subdomains[subdomains.length - 1]}`;
  }
  return hostname;
});
