import BigNumber from 'bignumber.js';

/** Returns 'obj' if it's the global object, otherwise returns undefined */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isGlobalObj(obj: any) {
  return obj && obj.Math == Math ? obj : undefined;
}

/** Get's the global object for the current JavaScript runtime */
const GLOBAL_OBJ =
  (typeof globalThis == 'object' && isGlobalObj(globalThis)) ||
  // eslint-disable-next-line no-restricted-globals
  (typeof window == 'object' && isGlobalObj(window)) ||
  (typeof self == 'object' && isGlobalObj(self)) ||
  (typeof global == 'object' && isGlobalObj(global)) ||
  (function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this;
  })() ||
  {};

export function uuid4() {
  const gbl = GLOBAL_OBJ;
  const crypto = gbl.crypto || gbl.msCrypto;

  let getRandomByte = () => Math.random() * 16;
  try {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '');
    }
    if (crypto && crypto.getRandomValues) {
      getRandomByte = () => crypto.getRandomValues(new Uint8Array(1))[0];
    }
  } catch (_) {
    // some runtimes can crash invoking crypto
    // https://github.com/getsentry/sentry-javascript/issues/8935
  }

  // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
  // Concatenating the following numbers as strings results in '10000000100040008000100000000000'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, c =>
    // eslint-disable-next-line no-bitwise
    (c ^ ((getRandomByte() & 15) >> (c / 4))).toString(16)
  );
}

export const RAINBOW_ICON_RAW_SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0ibm9uZSI+PGcgY2xpcC1wYXRoPSJ1cmwoI2EpIj48cGF0aCBmaWxsPSJ1cmwoI2IpIiBkPSJNMCAwaDMydjMySDB6Ii8+PHBhdGggZmlsbD0idXJsKCNjKSIgZD0iTTUuMzMzIDEwLjEzM2gxLjZjOC4yNDggMCAxNC45MzQgNi42ODYgMTQuOTM0IDE0LjkzNHYxLjZoMy4yYTEuNiAxLjYgMCAwIDAgMS42LTEuNmMwLTEwLjg5OS04LjgzNS0xOS43MzQtMTkuNzM0LTE5LjczNGExLjYgMS42IDAgMCAwLTEuNiAxLjZ2My4yWiIvPjxwYXRoIGZpbGw9InVybCgjZCkiIGQ9Ik0yMi40IDI1LjA2N2g0LjI2N2ExLjYgMS42IDAgMCAxLTEuNiAxLjZIMjIuNHYtMS42WiIvPjxwYXRoIGZpbGw9InVybCgjZSkiIGQ9Ik02LjkzMyA1LjMzM1Y5LjZoLTEuNlY2LjkzM2ExLjYgMS42IDAgMCAxIDEuNi0xLjZaIi8+PHBhdGggZmlsbD0idXJsKCNmKSIgZD0iTTUuMzMzIDkuNmgxLjZjOC41NDIgMCAxNS40NjcgNi45MjUgMTUuNDY3IDE1LjQ2N3YxLjZoLTQuOHYtMS42YzAtNS44OTEtNC43NzYtMTAuNjY3LTEwLjY2Ny0xMC42NjdoLTEuNlY5LjZaIi8+PHBhdGggZmlsbD0idXJsKCNnKSIgZD0iTTE4LjEzMyAyNS4wNjdIMjIuNHYxLjZoLTQuMjY3di0xLjZaIi8+PHBhdGggZmlsbD0idXJsKCNoKSIgZD0iTTUuMzMzIDEzLjg2N1Y5LjZoMS42djQuMjY3aC0xLjZaIi8+PHBhdGggZmlsbD0idXJsKCNpKSIgZD0iTTUuMzMzIDE2LjUzM2ExLjYgMS42IDAgMCAwIDEuNiAxLjYgNi45MzMgNi45MzMgMCAwIDEgNi45MzQgNi45MzQgMS42IDEuNiAwIDAgMCAxLjYgMS42aDIuNjY2di0xLjZjMC02LjE4Ni01LjAxNC0xMS4yLTExLjItMTEuMmgtMS42djIuNjY2WiIvPjxwYXRoIGZpbGw9InVybCgjaikiIGQ9Ik0xMy44NjcgMjUuMDY3aDQuMjY2djEuNmgtMi42NjZhMS42IDEuNiAwIDAgMS0xLjYtMS42WiIvPjxwYXRoIGZpbGw9InVybCgjaykiIGQ9Ik02LjkzMyAxOC4xMzNhMS42IDEuNiAwIDAgMS0xLjYtMS42di0yLjY2NmgxLjZ2NC4yNjZaIi8+PC9nPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0iYyIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFRyYW5zZm9ybT0icm90YXRlKC05MCAxNiA5LjA2Nykgc2NhbGUoMTkuNzMzMykiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9Ii43NyIgc3RvcC1jb2xvcj0iI0ZGNDAwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzg3NTRDOSIvPjwvcmFkaWFsR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJmIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoLTkwIDE2IDkuMDY3KSBzY2FsZSgxNS40NjY3KSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjcyNCIgc3RvcC1jb2xvcj0iI0ZGRjcwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGOTkwMSIvPjwvcmFkaWFsR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJpIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoLTkwIDE2IDkuMDY3KSBzY2FsZSgxMS4yKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjU5NSIgc3RvcC1jb2xvcj0iIzBBRiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAxREE0MCIvPjwvcmFkaWFsR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJqIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoNC41MzMzMyAwIDAgMTIuMDg4OSAxMy42IDI1Ljg2NykiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjMEFGIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDFEQTQwIi8+PC9yYWRpYWxHcmFkaWVudD48cmFkaWFsR3JhZGllbnQgaWQ9ImsiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgwIC00LjUzMzMzIDg1Ljk2NTQgMCA2LjEzMyAxOC40KSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIHN0b3AtY29sb3I9IiMwQUYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMURBNDAiLz48L3JhZGlhbEdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9IjE2IiB4Mj0iMTYiIHkxPSIwIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjMTc0Mjk5Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDAxRTU5Ii8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImQiIHgxPSIyMi4xMzMiIHgyPSIyNi42NjciIHkxPSIyNS44NjciIHkyPSIyNS44NjciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjRkY0MDAwIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjODc1NEM5Ii8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImUiIHgxPSI2LjEzMyIgeDI9IjYuMTMzIiB5MT0iNS4zMzMiIHkyPSI5Ljg2NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIHN0b3AtY29sb3I9IiM4NzU0QzkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRjQwMDAiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjE4LjEzMyIgeDI9IjIyLjQiIHkxPSIyNS44NjciIHkyPSIyNS44NjciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjRkZGNzAwIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRkY5OTAxIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImgiIHgxPSI2LjEzMyIgeDI9IjYuMTMzIiB5MT0iMTMuODY3IiB5Mj0iOS42IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iI0ZGRjcwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGOTkwMSIvPjwvbGluZWFyR3JhZGllbnQ+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMCAwaDMydjMySDB6Ii8+PC9jbGlwUGF0aD48L2RlZnM+PC9zdmc+';

export const getDappHost = (url?: string) => {
  try {
    if (url) {
      const host = new URL(url).host;
      if (host.indexOf('www.') === 0) {
        return host.replace('www.', '');
      }
      return host;
    }
    return '';
  } catch (e) {
    return '';
  }
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export enum IN_DAPP_NOTIFICATION_STATUS {
  'success' = 'success',
  'no_active_session' = 'no_active_session',
  'unsupported_network' = 'unsupported_network',
  'already_added' = 'already_added',
  'set_as_active' = 'set_as_active',
  'already_active' = 'already_active',
}

/**
 * @desc Adds an "0x" prefix to a string if one is not present.
 * @param value The starting string.
 * @return The prefixed string.
 */
export const addHexPrefix = (value: string): string => (value.startsWith('0x') ? value : `0x${value}`);

export const convertStringToHex = (stringToConvert: string): string => new BigNumber(stringToConvert).toString(16);

export const toHex = (stringToConvert: string): string => addHexPrefix(convertStringToHex(stringToConvert));

/**
 * Determines if the provider should be injected
 */
export function shouldInjectProvider() {
  return doctypeCheck() && suffixCheck() && documentElementCheck();
}

/**
 * Checks the doctype of the current document if it exists
 */
function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that we should not inject the provider into. This check is indifferent of
 * query parameters in the location.
 */
function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 */
function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}
