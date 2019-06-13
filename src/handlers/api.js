import axios from 'axios';

/**
 * Configuration for Dapple API
 * @type axios instance
 */
const api = axios.create({
  baseURL: 'https://dapple.rainbow.me',
  timeout: 30000, // 30 secs
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * @desc get ethereum gas prices
 * @return {Promise}
 */
export const apiGetGasPrices = () => api.get(`/get_eth_gas_prices`);
