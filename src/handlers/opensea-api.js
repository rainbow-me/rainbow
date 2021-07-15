import { OPENSEA_API_KEY, OPENSEA_RINKEBY_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import { AssetType } from '@rainbow-me/entities';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import logger from 'logger';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const apiGetAccountUniqueTokens = async (network, address, page) => {
  try {
    const isPolygon = network === AssetType.polygon;
    const API_KEY =
      network === NetworkTypes.rinkeby
        ? OPENSEA_RINKEBY_API_KEY
        : OPENSEA_API_KEY;
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/assets?exclude_currencies=true&owner=${address}&limit=${UNIQUE_TOKENS_LIMIT_PER_PAGE}&offset=${offset}`;
    const urlV2 = `https://api.opensea.io/api/v2/assets/matic?owner_address=${address}&limit=${UNIQUE_TOKENS_LIMIT_PER_PAGE}&offset=${offset}`;
    const data = await rainbowFetch(isPolygon ? urlV2 : url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': API_KEY,
      },
      method: 'get',
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
  network,
  urlSuffixForAsset
) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/asset/${urlSuffixForAsset}`;
    const data = await rainbowFetch(url, {
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
