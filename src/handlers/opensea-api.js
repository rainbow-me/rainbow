import axios from 'axios';
import { parseAccountUniqueTokens } from '../parsers/uniqueTokens';

/**
 * Configuration for opensea api
 * @type axios instance
 */
const api = axios.create({
  baseURL: 'https://api.opensea.io/api/v1',
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

/**
 * @desc get opensea unique tokens
 * @param  {String}   [address='']
 * @return {Promise}
 */
export const apiGetAccountUniqueTokens = async (address = '') => {
  try {
    const data = await api.get(
      `/assets?exclude_currencies=true&owner=${address}&limit=300`
    );
    return parseAccountUniqueTokens(data);
  } catch (error) {
    console.log('Error getting unique tokens', error);
    throw error;
  }
};
