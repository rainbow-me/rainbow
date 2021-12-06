import { captureException } from '@sentry/react-native';
import { rainbowFetch } from '../rainbow-fetch';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parsePoaps } from '@rainbow-me/parsers';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export const fetchPoaps = async (address: string) => {
  try {
    const url = `https://api.poap.xyz/actions/scan/${address}`;
    const data = await rainbowFetch(url, {
      timeout: 10000, // 10 secs
    });
    return parsePoaps(data);
  } catch (error) {
    logger.log('Error getting POAPs', error);
    captureException(error);
  }
};
