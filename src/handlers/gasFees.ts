import { RainbowFetchClient } from '../rainbow-fetch';

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
 * @desc get Polygon time estimates
 * @params {data}
 * @return {Promise}
 */
export const polygonGetGasEstimates = (data: any) => {
  return {
    ...data,
    avgWait: 0.5,
    fastWait: 0.2,
    safeLowWait: 1,
  };
};
