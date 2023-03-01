/*global storage*/
import { MMKV } from 'react-native-mmkv';
import { logger, RainbowError } from '@/logger';

const defaultVersion = '0.1.0';

const LEGACY_STORAGE_KEY = 'rainbowLegacyStorage';

/**
 * @desc untyped mmkv storage to replace AsyncStorage
 *
 * @deprecated do not use this for new storage, use @/storage instead
 */
const legacyStorage = new MMKV({ id: LEGACY_STORAGE_KEY });

export const getKey = (prefix: any, accountAddress: any, network: any) =>
  `${prefix}-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;

/**
 * @desc get from mmkv local storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 * @deprecated Use wrapper function `getLocal` instead
 */
const getLocalMMKV = async ({
  key,
  version = defaultVersion,
}: {
  key: string;
  version: string;
}) => {
  try {
    const stringifiedData = legacyStorage.getString(key);

    if (stringifiedData) {
      const parsedData = JSON.parse(stringifiedData);
      if (parsedData.storageVersion === version) {
        return parsedData;
      }
      return null;
    }
  } catch (error) {
    logger.error(
      new RainbowError('Storage: error getting from legacy mmkv storage', {})
    );
  }
};

/**
 * @desc save to mmkv local storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */
const saveLocalMMKV = async ({
  key,
  data,
  version,
}: {
  key: string;
  data: any;
  version: string;
}) => {
  try {
    data.storageVersion = version;
    legacyStorage.set(key, JSON.stringify(data));
  } catch (error) {
    logger.error(
      new RainbowError('Storage: error saving to legacy mmkv storage')
    );
  }
};

/**
 * @desc save to async storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 *
 * @deprecated Use wrapper function `saveLocal` instead
 */
export const saveLocalAsync = async (
  key = '',
  data = {},
  version = defaultVersion
) => {
  try {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'storageVersion' does not exist on type '... Remove this comment to see the full error message
    data.storageVersion = version;
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    await storage.save({
      data,
      expires: null,
      key,
    });
  } catch (error) {
    logger.log('Storage: error saving to local for key', { key });
  }
};

/**
 * @desc get from async storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 * @deprecated Use wrapper function `getLocal` instead
 */
export const getLocalAsync = async (key = '', version = defaultVersion) => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    const result = await storage.load({
      autoSync: false,
      key,
      syncInBackground: false,
    });
    if (result && result.storageVersion === version) {
      return result;
    } else if (result && result.storageVersion !== version) {
      removeLocalAsync(key);
      return null;
    }
    return null;
  } catch (error) {
    logger.log('Storage: error getting from local for key', { key });
    return null;
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 */
export const getLocal = async (key = '', version = defaultVersion) => {
  try {
    const mmkvData = await getLocalMMKV({ key, version });

    // if we have data in mmkv we want to use that
    if (mmkvData) {
      return mmkvData;
    } else {
      // otherwise we want to get the data from the legacy async storage
      const result = await getLocalAsync(key, version);
      return result;
    }
  } catch {
    logger.log('Storage: error getting from local for key', { key });
    return null;
  }
};

/**
 * @desc save to storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 *
 */
export const saveLocal = async (
  key = '',
  data = {},
  version = defaultVersion
) => {
  try {
    saveLocalMMKV({ key, data, version });

    // once we save to mmkv lets check if we have data in async storage and remove it
    removeLocalAsync(key);
  } catch (error) {
    logger.log('Storage: error saving to local for key', { key });
  }
};

/**
 * @desc remove from old async storage
 * @param  {String}  [key='']
 * @return {Object}
 */
export const removeLocalAsync = (key = '') => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    storage.remove({ key });
  } catch (error) {
    logger.log('Storage: error removing local with key', { key });
  }
};

export const getGlobal = async (
  key: any,
  emptyState: any,
  version = defaultVersion
) => {
  const result = await getLocal(key, version);
  return result ? result.data : emptyState;
};

export const saveGlobal = (key: any, data: any, version = defaultVersion) =>
  saveLocal(key, { data }, version);

export const getAccountLocal = async (
  prefix: any,
  accountAddress: any,
  network: any,
  emptyState = [],
  version = defaultVersion
) => {
  const key = getKey(prefix, accountAddress, network);
  const result = await getLocal(key, version);
  return result ? result.data : emptyState;
};

export const saveAccountLocal = (
  prefix: any,
  data: any,
  accountAddress: any,
  network: any,
  version = defaultVersion
) => saveLocal(getKey(prefix, accountAddress, network), { data }, version);

export const removeAccountLocal = (
  prefix: any,
  accountAddress: any,
  network: any
) => {
  const key = getKey(prefix, accountAddress, network);
  removeLocalAsync(key);
};
