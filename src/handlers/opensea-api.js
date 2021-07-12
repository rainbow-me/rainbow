import axios from 'axios';
import { AssetType } from '@rainbow-me/entities';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import logger from 'logger';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

const api = axios.create({
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

export const apiGetAccountUniqueTokens = async (network, address, page) => {
  try {
    const isPolygon = network === AssetType.polygon;
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/assets?exclude_currencies=true&owner=${address}&limit=${UNIQUE_TOKENS_LIMIT_PER_PAGE}&offset=${offset}`;
    const urlV2 = `https://api.opensea.io/api/v2/assets/matic?exclude_currencies=true&owner=${address}&limit=${UNIQUE_TOKENS_LIMIT_PER_PAGE}&offset=${offset}`;
    const data = await api.get(isPolygon ? urlV2 : url);
    return parseAccountUniqueTokens(data, network);
  } catch (error) {
    logger.log('Error getting unique tokens', error);
    throw error;
  }
};
