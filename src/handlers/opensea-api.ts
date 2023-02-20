import { captureException } from '@sentry/react-native';
import PQueue from 'p-queue/dist';
import {
  // @ts-ignore
  NFT_API_KEY,
  // @ts-ignore
  NFT_API_URL,
} from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes from '@/helpers/networkTypes';
import { handleSignificantDecimals } from '@/helpers/utilities';
import logger from '@/utils/logger';

// limiting our opensea api requests to 10/sec so we don't max out
const queue = new PQueue({ interval: 1000, intervalCap: 10 });

export const apiGetUniqueTokenFloorPrice = async (
  network: any,
  urlSuffixForAsset: any
) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const url = `https://${networkPrefix}${NFT_API_URL}/api/v1/asset/${urlSuffixForAsset}`;
    const data = await queue.add(
      async () =>
        await rainbowFetch(url, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': NFT_API_KEY, // 5 secs
          },
          method: 'get',
          timeout: 5000,
        })
    );

    const slug = data?.data?.collection?.slug;

    const collectionURL = `https://${networkPrefix}${NFT_API_URL}/api/v1/collection/${slug}`;
    const collectionData = await queue.add(
      async () =>
        await rainbowFetch(collectionURL, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': NFT_API_KEY,
          },
          method: 'get',
          timeout: 5000, // 5 secs
        })
    );

    const tempPrice = collectionData?.data?.collection?.stats?.floor_price;

    if (parseFloat(tempPrice) === 0 || !tempPrice) {
      return 'None';
    }

    const tempFloorPrice = handleSignificantDecimals(tempPrice, 5);

    return parseFloat(tempFloorPrice) + ' ETH';
  } catch (error) {
    logger.sentry('Error getting NFT floor price', error);
    captureException(new Error('Opensea: Error getting NFT floor price'));
    throw error;
  }
};
