import axios from 'axios';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import { multiply } from '../helpers/utilities';
import { ethUnits } from '@rainbow-me/references';

/**
 * Configuration for Dapple API
 * @type axios instance
 */
const ethGasstationApi = axios.create({
  baseURL: 'https://dapple.rainbow.me',
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
  ethGasstationApi.get('/get_eth_gas_prices');

/**
 * Configuration for Etherscan API
 * @type axios instance
 */
const etherscanAPI = axios.create({
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
  etherscanAPI.get(
    `/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
  );

/**
 * @desc get ethereum gas prices from Etherscan
 * @return {Promise}
 */
export const etherscanGetGasEstimates = async data => {
  const getEstimatedTimeForGasPrice = (speed, gwei) => {
    return new Promise(async (resolve, reject) => {
      const priceInWei = multiply(gwei, ethUnits.gwei);
      const { data: response } = await etherscanAPI.get(
        `/api?module=gastracker&action=gasestimate&gasprice=${priceInWei}&apikey=${ETHERSCAN_API_KEY}`
      );
      if (response.status === '1') {
        // Convert from seconds to minutes!
        resolve({
          [`${speed === 'average' ? 'avg' : speed}Wait`]:
            Number(response.result) / 60,
        });
      } else {
        reject({ [`${speed}Wait`]: 0 });
      }
    });
  };

  const requests = Object.keys(data).map(speed =>
    getEstimatedTimeForGasPrice(speed, data[speed])
  );

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
