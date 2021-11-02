import {
  ETH_GAS_STATION_API_KEY,
  ETHERSCAN_API_KEY,
} from 'react-native-dotenv';
import { RainbowFetchClient } from '../rainbow-fetch';

/**
 * Configuration for defipulse API
 * @type RainbowFetchClient instance
 */
const ethGasstationApi = new RainbowFetchClient({
  baseURL: 'https://data-api.defipulse.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get ethereum gas prices
 * @return {Promise}
 */
export const ethGasStationGetGasPrices = () =>
  ethGasstationApi.get(`/api/v1/egs/api/ethgasAPI.json`, {
    params: {
      'api-key': ETH_GAS_STATION_API_KEY,
    },
  });

const rainbowMeteorologyApi = new RainbowFetchClient({
  baseURL: 'https://metadata.p.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export const rainbowMeteorologyGetData = () =>
  rainbowMeteorologyApi.get(`/meteorology/v1/gas/mainnet`, {});

/**
 * Configuration for Polygon GAS Station API
 * @type RainbowFetchClient instance
 */
const polygonGasStationApi = new RainbowFetchClient({
  baseURL: 'https://gpoly.blockscan.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get Polygon gas prices
 * @return {Promise}
 */
export const polygonGasStationGetGasPrices = () =>
  polygonGasStationApi.get(`/gasapi.ashx?apikey=key&method=gasoracle`);

/**
 * Configuration for Etherscan API
 * @type RainbowFetchClient instance
 */
const etherscanAPI = new RainbowFetchClient({
  baseURL: 'https://api.etherscan.io',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get ethereum gas prices from Etherscan
 * @return {Promise}
 */
export const etherscanGetGasPrices = () =>
  etherscanAPI.get(`/api`, {
    params: {
      action: 'gasoracle',
      apikey: ETHERSCAN_API_KEY,
      module: 'gastracker',
    },
  });

/**
 * @desc get Polygon time estimates
 * @params {data}
 * @return {Promise}
 */
export const polygonGetGasEstimates = data => {
  return {
    ...data,
    avgWait: 0.5,
    fastWait: 0.2,
    safeLowWait: 1,
  };
};
