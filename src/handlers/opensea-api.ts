import { captureException } from '@sentry/react-native';
import {
  // @ts-ignore
  NFT_API_KEY,
  // @ts-ignore
  NFT_API_URL,
} from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes, { Network } from '@rainbow-me/networkTypes';
import {
  parseAccountUniqueTokens,
  parseAccountUniqueTokensPolygon,
} from '@rainbow-me/parsers';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import logger from 'logger';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE: number = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL: number = 2000;

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
    const data = await rainbowFetch(isPolygon ? urlV2 : url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': NFT_API_KEY,
      },
      method: 'get',
      params: {
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
    });
    return isPolygon
      ? parseAccountUniqueTokensPolygon(data)
      : parseAccountUniqueTokens(data);
  } catch (error) {
    logger.sentry('Error getting unique tokens', error);
    captureException(new Error('Opensea: Error getting unique tokens'));
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
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': NFT_API_KEY, // 5 secs
      },
      method: 'get',
      timeout: 5000,
    });

    const slug = data?.data?.collection?.slug;

    const collectionURL = `https://${networkPrefix}${NFT_API_URL}/api/v1/collection/${slug}`;
    const collectionData = await rainbowFetch(collectionURL, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': NFT_API_KEY,
      },
      method: 'get',
      timeout: 5000, // 5 secs
    });

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

export const apiGetNftSemiFungibility = async (
  networkPrefix: string,
  contractAddress: string,
  tokenID: string
) => {
  try {
    const requestURL = `https://${networkPrefix}api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=1`;

    const fungibility = await rainbowFetch(requestURL, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    });

    const semiFungible =
      fungibility?.data?.asset_events[0]?.asset?.asset_contract
        ?.asset_contract_type === 'semi-fungible';
    return semiFungible;
  } catch (error) {
    logger.sentry('Error getting NFT fungibility', error);
    captureException(new Error('Opensea: Error getting NFT fungibility'));
    throw error;
  }
};

export const apiGetNftTransactionHistoryForEventType = async (
  networkPrefix: string,
  semiFungible: boolean,
  accountAddress: string,
  contractAddress: string,
  tokenID: string,
  eventType: string
) => {
  try {
    let offset = 0;
    let array: any[] = [];
    let nextPage = true;
    while (nextPage) {
      const requestURL = semiFungible
        ? `https://${networkPrefix}api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&event_type=${eventType}&only_opensea=false&offset=${offset}&limit=300`
        : `https://${networkPrefix}api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&event_type=${eventType}&only_opensea=false&offset=${offset}&limit=300`;

      let currentPage = await rainbowFetch(requestURL, {
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': OPENSEA_API_KEY,
        },
        method: 'get',
        timeout: 10000, // 10 secs
      });
      array = array.concat(currentPage?.data?.asset_events || []);
      offset = array.length + 1;
      nextPage = currentPage?.data?.asset_events?.length === 300;
    }
    return array;
  } catch (error) {
    logger.sentry('Error getting NFT transaction history', error);
    captureException(
      new Error('Opensea: Error getting NFT transaction history')
    );
    throw error;
  }
};
