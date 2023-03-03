// @ts-ignore
import { POAP_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import { parsePoaps } from '@/parsers';
import { logger, RainbowError } from '@/logger';

export const fetchPoaps = async (address: string) => {
  try {
    const url = `https://api.poap.tech/actions/scan/${address}`;
    const data = await rainbowFetch(url, {
      headers: {
        'x-api-key': POAP_API_KEY,
      },
      timeout: 10000, // 10 secs
    });
    return parsePoaps(data);
  } catch (e: any) {
    logger.error(new RainbowError('Error getting POAPs'), {
      message: e.message,
    });
  }
};
