import { captureException } from '@sentry/react-native';
import PQueue from 'p-queue/dist';
import {
  // @ts-ignore
  NFT_API_KEY,
  // @ts-ignore
  NFT_API_URL,
} from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes, { Network } from '@/helpers/networkTypes';
import {
  parseAccountUniqueTokens,
  parseAccountUniqueTokensPolygon,
} from '@/parsers';
import { handleSignificantDecimals } from '@/helpers/utilities';
import logger from '@/utils/logger';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

// limiting our opensea api requests to 10/sec so we don't max out
const queue = new PQueue({ interval: 1000, intervalCap: 10 });

export const apiGetAccountUniqueTokens = async (
  network: Network,
  address: string,
  page: number
) => {
  try {
    const isPolygon = network === NetworkTypes.polygon;
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}${NFT_API_URL}/api/v1/assets`;
    const urlV2 = `https://${NFT_API_URL}/api/v2/beta/assets`;
    const data = await queue.add(
      async () =>
        await rainbowFetch(isPolygon ? urlV2 : url, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': NFT_API_KEY,
          },
          method: 'get',
          params: {
            include_orders: 'true',
            // @ts-expect-error ts-migrate(2322) FIXME: Type '{ limit: number; offset: number; owner: any;... Remove this comment to see the full error message
            limit: UNIQUE_TOKENS_LIMIT_PER_PAGE,
            // @ts-expect-error ts-migrate(2322) FIXME: Type '{ limit: number; offset: number; owner: any;... Remove this comment to see the full error message
            offset: offset,
            ...(isPolygon
              ? {
                  chain_identifier: 'matic',
                  owner_address: address,
                }
              : {
                  owner: address,
                }),
          },
          timeout: 10000, // 10 secs
        })
    );

    return parseAccountUniqueTokens(data);
  } catch (error: any) {
    // opensea gives us an error if the account has no tokens on the network, we want to ignore this error
    if (
      error.responseBody[0]?.includes('does not exist for chain identifier')
    ) {
      return [];
    } else {
      logger.sentry('Error getting unique tokens', error);
      captureException(new Error('Opensea: Error getting unique tokens'));
      throw error;
    }
  }
};

export const apiGetAccountUniqueToken = async (
  network: Network,
  contractAddress: string,
  tokenId: string,
  // The `forceUpdate` param triggers an NFT metadata refresh
  { forceUpdate = false }: { forceUpdate?: boolean } = {}
) => {
  try {
    const isPolygon = network === NetworkTypes.polygon;
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const url = `https://${networkPrefix}${NFT_API_URL}/api/v1/asset/${contractAddress}/${tokenId}${
      forceUpdate ? '?force_update=true' : ''
    }`;
    const urlV2 = `https://${NFT_API_URL}/api/v2/beta/asset/${contractAddress}/${tokenId}${
      forceUpdate ? '?force_update=true' : ''
    }`;
    const { data } = await queue.add(
      async () =>
        await rainbowFetch(isPolygon ? urlV2 : url, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': NFT_API_KEY,
          },
          method: 'get',
          timeout: 10000, // 10 secs
        })
    );
    return isPolygon
      ? parseAccountUniqueTokensPolygon({
          data: { results: [data] },
        })?.[0]
      : parseAccountUniqueTokens({ data: { assets: [data] } })?.[0];
  } catch (error) {
    logger.sentry('Error getting unique token', error);
    captureException(new Error('Opensea: Error getting unique token'));
    throw error;
  }
};

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
