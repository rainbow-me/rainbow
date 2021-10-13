import {
  BLOCK_NATIVE_API_KEY,
  ETH_GAS_STATION_API_KEY,
  ETHERSCAN_API_KEY,
} from 'react-native-dotenv';
import { multiply } from '../helpers/utilities';
import { RainbowFetchClient } from '../rainbow-fetch';
import { defaultGasParamsFormat } from '@rainbow-me/parsers';
import { ethUnits } from '@rainbow-me/references';

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

const blockNativeApi = new RainbowFetchClient({
  baseURL: 'https://api.blocknative.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export const blockNativeGetGasParams = () =>
  blockNativeApi.get(`/gasprices/blockprices`, {
    headers: {
      Authorization: `${BLOCK_NATIVE_API_KEY}`,
    },
  });

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

/**
 * @desc get ethereum gas prices from Etherscan
 * @params {data}
 * @return {Promise}
 */
export const etherscanGetGasFeesEstimates = async gasFeeParamsBySpeed => {
  const requests = Object.keys(gasFeeParamsBySpeed).map(speed => {
    return new Promise(async resolve => {
      try {
        const totalGasFee =
          gasFeeParamsBySpeed[speed].maxFeePerGas.gwei +
          gasFeeParamsBySpeed[speed].maxPriorityFeePerGas.gwei;

        const time = await getEstimatedTimeForGasPrice(Math.round(totalGasFee));
        resolve({
          speed,
          time,
        });
        return;
      } catch (e) {
        resolve();
      }
    });
  });
  const estimates = await Promise.all(requests);
  const newGasFeeParamsBySpeed = { ...gasFeeParamsBySpeed };
  estimates
    .filter(estimate => estimate)
    .forEach(({ speed, time }) => {
      newGasFeeParamsBySpeed[speed] = defaultGasParamsFormat(
        speed,
        time,
        newGasFeeParamsBySpeed[speed].baseFeePerGas.gwei,
        newGasFeeParamsBySpeed[speed].maxFeePerGas.gwei,
        newGasFeeParamsBySpeed[speed].maxPriorityFeePerGas.gwei
      );
    });

  return newGasFeeParamsBySpeed;
};

/**
 * @desc get ethereum gas prices from Etherscan
 * @params {data}
 * @return {Promise}
 */
export const etherscanGetGasEstimates = async data => {
  const requests = Object.keys(data).map(speed => {
    return new Promise(async resolve => {
      const time = await getEstimatedTimeForGasPrice(data[speed]);
      resolve({
        [`${speed === 'average' ? 'avg' : speed}Wait`]: time,
      });
    });
  });

  let newData = { ...data };

  const estimates = await Promise.all(requests);
  estimates.forEach(estimate => {
    newData = {
      ...newData,
      ...estimate,
    };
  });

  return newData;
};

/**
 * @desc get estimated time for a specific gas price from Etherscan
 * @return {Promise}
 */
export const getEstimatedTimeForGasPrice = async gwei => {
  const priceInWei = multiply(gwei, ethUnits.gwei);
  const { data: response } = await etherscanAPI.get(`/api`, {
    params: {
      action: 'gasestimate',
      apikey: ETHERSCAN_API_KEY,
      gasprice: priceInWei,
      module: 'gastracker',
    },
  });
  if (response.status === '0') {
    throw new Error('Etherscan gas estimation request failed');
  }
  return Number(response.result) / 60;
};
