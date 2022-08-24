import { captureException } from '@sentry/react-native';
// @ts-ignore
import { POAP_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import { parsePoaps } from '@rainbow-me/parsers';
import logger from 'logger';

export const fetchPoaps = async (address: string) => {
  try {
    const url = `https://api.poap.xyz/actions/scan/${address}`;
    const data = await rainbowFetch(url, {
      headers: {
        'x-api-key': POAP_API_KEY,
      },
      timeout: 10000, // 10 secs
    });
    return parsePoaps(data);
  } catch (error) {
    logger.log('Error getting POAPs', error);
    captureException(error);
  }
};
