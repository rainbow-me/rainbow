import axios from 'axios';

/**
 * Configuration for Dapple API
 * @type axios instance
 */
const api = axios.create({
  baseURL: 'https://dapple.rainbow.me',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get ethereum gas prices
 * @return {Promise}
 */
export const apiGetGasPrices = () => api.get('/get_eth_gas_prices');
