import { logger, RainbowError } from '@/logger';
import { legacy } from '@/storage/legacy';
import { LEGACY_ASYNC_STORAGE_VERSION, removeLegacyAsyncStorageValue } from '@/storage/legacyAsyncStorage';

const defaultVersion = LEGACY_ASYNC_STORAGE_VERSION;

export const getKey = (prefix: any, accountAddress: any, network: any) =>
  `${prefix}-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;

/**
 * @desc save to storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */
export const saveLocal = (key = '', data = {}) => {
  try {
    legacy.set([key], data);
  } catch (error) {
    logger.error(new RainbowError('[localstorage/common]: saveLocal error'));
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */

export const getLocal = async (key = '') => {
  return await legacy.get([key]);
};

export const getGlobal = async (key: any, emptyState: any, version = defaultVersion) => {
  const result = await getLocal(key);
  return result ? result.data : emptyState;
};

export const saveGlobal = (key: any, data: any, version = defaultVersion) => saveLocal(key, { data });

export const getAccountLocal = async (prefix: any, accountAddress: any, network: any, emptyState = [], version = defaultVersion) => {
  const key = getKey(prefix, accountAddress, network);
  const result = await getLocal(key);
  return result ? result.data : emptyState;
};

export function saveAccountLocal(prefix: any, data: any, accountAddress: any, network: any, version = defaultVersion) {
  return saveLocal(getKey(prefix, accountAddress, network), { data });
}

export const removeAccountLocal = (prefix: any, accountAddress: any, network: any) => {
  const key = getKey(prefix, accountAddress, network);
  removeLegacyAsyncStorageValue(key);
};
