// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { OPENSEA_API_KEY, OPENSEA_RINKEBY_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/networkTypes' or i... Remove this comment to see the full error message
import NetworkTypes from '@rainbow-me/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { handleSignificantDecimals } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const apiGetAccountUniqueTokens = async (
  network: any,
  address: any,
  page: any
) => {
  try {
    const API_KEY =
      network === NetworkTypes.rinkeby
        ? OPENSEA_RINKEBY_API_KEY
        : OPENSEA_API_KEY;
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/assets`;
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': API_KEY,
      },
      method: 'get',
      // @ts-expect-error ts-migrate(2322) FIXME: Type '{ limit: number; offset: number; owner: any;... Remove this comment to see the full error message
      params: {
        limit: UNIQUE_TOKENS_LIMIT_PER_PAGE,
        offset: offset,
        owner: address,
      },
      timeout: 20000, // 20 secs
    });
    return parseAccountUniqueTokens(data);
  } catch (error) {
    logger.log('Error getting unique tokens', error);
    throw error;
  }
};

export const apiGetUniqueTokenFloorPrice = async (
  network: any,
  urlSuffixForAsset: any
) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/asset/${urlSuffixForAsset}`;
    const data = await rainbowFetch(url, {
      // @ts-expect-error ts-migrate(2322) FIXME: Type '{ Accept: string; method: string; timeout: n... Remove this comment to see the full error message
      headers: {
        Accept: 'application/json',
        method: 'get',
        timeout: 5000, // 5 secs
      },
    });

    const slug = data?.data?.collection?.slug;

    const collectionURL = `https://${networkPrefix}api.opensea.io/api/v1/collection/${slug}`;
    const collectionData = await rainbowFetch(collectionURL, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
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
    logger.debug('FLOOR PRICE ERROR', error);
    throw error;
  }
};
