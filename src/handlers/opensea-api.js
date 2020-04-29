import axios from 'axios';
import { parseAccountUniqueTokens } from '../parsers/uniqueTokens';
import { logger } from '../utils';

export const UNIQUE_TOKENS_LIMIT = 50;

const api = axios.create({
  baseURL: 'https://api.opensea.io/api/v1',
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

export const apiGetAccountUniqueTokens = async (address, page) => {
  try {
    const offset = page * UNIQUE_TOKENS_LIMIT;
    const data = await api.get(
      `/assets?exclude_currencies=true&owner=${address}&limit=${UNIQUE_TOKENS_LIMIT}&offset=${offset}`
    );
    return parseAccountUniqueTokens(data);
  } catch (error) {
    logger.log('Error getting unique tokens', error);
    throw error;
  }
};
