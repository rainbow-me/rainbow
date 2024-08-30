/*global storage*/
import { legacy } from '@/storage/legacy';
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
export const saveLocal = (key = '', data = {}) => {
  try {
    legacy.set([key], data);
  } catch (error) {
    logger.error(new RainbowError('Legacy Storage: saveLocal error'));
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

/**
 * @desc save to legacy async storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 *
 * @deprecated use @/storage/legacy
 */
export const deprecatedSaveLocal = async (key = '', data = {}, version = defaultVersion) => {
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
    logger.error(new RainbowError('Storage: deprecatedSaveLocal error'));
  }
};

/**
 * @desc get from legacy async storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 * @deprecated use @/storage/legacy
 */
export const deprecatedGetLocal = async (key = '', version = defaultVersion) => {
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
      deprecatedRemoveLocal(key);
      return null;
    }
    return null;
  } catch (error: any) {
    /**
     * react-native-storage throws errors when the key is not found or it's
     * expired, and we don't need to send those to Sentry
     *
     * @see https://github.com/sunnylqm/react-native-storage/blob/96df43f0028a6afd08bc56e80d327fabb5fff583/README.md?plain=1#L107-L114
     */
    switch (error.name) {
      case 'NotFoundError':
      case 'ExpiredError':
        break;
      default:
        logger.error(new RainbowError('Storage: deprecatedGetLocal error'));
    }

    return null;
  }
};

/**
 * @desc  remove from deprecated async storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 * @deprecated use @/storage/legacy
 */
export const deprecatedRemoveLocal = (key = '') => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    storage.remove({ key });
  } catch (error) {
    logger.error(new RainbowError('Storage: deprecatedRemoveLocal error'));
  }
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
  deprecatedRemoveLocal(key);
};
