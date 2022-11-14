import {
  GasFeesBscGasStationData,
  GasFeesPolygonGasStationData,
} from '@/entities/gas';
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
export const polygonGasStationGetGasPrices = (): Promise<{
  data: GasFeesPolygonGasStationData;
}> => polygonGasStationApi.get(`/gasapi.ashx?apikey=key&method=gasoracle`);

/**
 * Configuration for BSC GAS Station API
 * @type RainbowFetchClient instance
 */
const bscGasStationApi = new RainbowFetchClient({
  baseURL: 'https://api.bscscan.com/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get BSC gas prices
 * @return {Promise}
 */
export const bscGasStationGetGasPrices = (): Promise<{
  data: GasFeesBscGasStationData;
}> =>
  bscGasStationApi.get(
    `?module=gastracker&action=gasoracle&apikey=YourApiKeyToken`
  );
