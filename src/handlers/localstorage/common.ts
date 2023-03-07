/*global storage*/
import { logger, RainbowError } from '@/logger';

const defaultVersion = '0.1.0';

export const getKey = (prefix: any, accountAddress: any, network: any) =>
  `${prefix}-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;

/**
 * @desc save to storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */
export const saveLocal = async (
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
    logger.error(new RainbowError('Storage: saveLocal error'));
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @return {Object}
 */
export const getLocal = async (key = '', version = defaultVersion) => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    const result = await storage.load({
      autoSync: false,
      key,
      syncInBackground: false,
    });
    if (result && result.storageVersion === version) {
      return result;
    }
    if (result) {
      removeLocal(key);
      return null;
    }
    return null;
  } catch (error) {
    logger.error(new RainbowError('Storage: getLocal error'));
    return null;
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @return {Object}
 */
export const removeLocal = (key = '') => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    storage.remove({ key });
  } catch (error) {
    logger.error(new RainbowError('Storage: removeLocal error'));
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
  removeLocal(key);
};
