import axios from 'axios';
import { get, mapKeys, toLower } from 'lodash';
import { logger } from '../utils';

/**
 * Configuration for api
 * @type axios instance
 */
const tokenOverridesEndpoint = axios.create({
  baseURL:
    'https://raw.githubusercontent.com/rainbow-me/asset-overrides/master/token-overrides.json',
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

/**
 * @desc get token overrides
 * @return {Promise}
 */
export const apiGetTokenOverrides = async () => {
  try {
    const data = await tokenOverridesEndpoint.get();
    const overrides = get(data, 'data') || {};
    return mapKeys(overrides, (value, address) => toLower(address));
  } catch (error) {
    logger.log('Error getting token overrides', error);
    throw error;
  }
};
