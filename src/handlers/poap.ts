import { rainbowFetch } from '../rainbow-fetch';
import { parsePoaps } from '@rainbow-me/parsers';
import logger from 'logger';

export const fetchPoaps = async (address: string) => {
  try {
    const url = `https://api.poap.xyz/actions/scan/${address}`;
    const data = await rainbowFetch(url, {});
    return parsePoaps(data);
  } catch (error) {
    logger.log('Error getting POAPs', error);
    throw error;
  }
};
